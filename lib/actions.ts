'use server';

import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import cloudinary from '@/lib/cloudinary';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2';
import { validatePrice } from '@/lib/currency';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password?: string;
  account_type: string;
  balance: string;
}

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  seller_id: number;
}

interface CartItemRow extends RowDataPacket {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  price_str?: string;
  seller_id?: number;
  name?: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
}

export async function register(formData: FormData): Promise<void> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return;
    }

    await pool.query(
      'INSERT INTO users (name, email, password, account_type) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'standard']
    );
  } catch (error) {
    console.error('Registration error:', error);
    return;
  }
}

async function logTransaction(
  connection: PoolConnection,
  userId: number,
  type: 'deposit' | 'purchase' | 'sale' | 'membership_fee' | 'withdrawal',
  amount: number,
  description: string,
  referenceId?: number
) {
  await connection.query(
    'INSERT INTO transactions (user_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)',
    [userId, type, amount, description, referenceId || null]
  );
}

export async function updateMembership(formData: FormData) {
  const accountType = formData.get('account_type') as string;
  const session = await auth();

  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get current user data
    const [userRows] = await connection.query<UserRow[]>('SELECT account_type, balance FROM users WHERE id = ?', [session.user.id]);
    const currentUser = userRows[0];

    if (!currentUser) {
      throw new Error('User not found');
    }

    // 2. If upgrading to pro, check balance and deduct 499
    if (accountType === 'pro' && currentUser.account_type !== 'pro') {
      const proCost = 499;
      const balance = parseFloat(currentUser.balance);

      if (balance < proCost) {
        throw new Error(`Insufficient balance for Pro upgrade. Cost: ₱${proCost}, Current Balance: ₱${balance.toLocaleString()}`);
      }

      // Deduct from balance
      await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [proCost, session.user.id]);

      // Log transaction
      await logTransaction(
        connection,
        parseInt(session.user.id),
        'membership_fee',
        proCost,
        'Upgrade to Pro Membership'
      );
    }

    // 3. Update account type and expiry
    let expiresAt: Date | null = null;
    if (accountType === 'pro') {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    await connection.query(
      'UPDATE users SET account_type = ?, membership_expires_at = ? WHERE id = ?',
      [accountType, expiresAt, session.user.id]
    );

    await connection.commit();

    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath('/membership');
    revalidatePath('/shop');
    revalidatePath('/');

    return { success: true };
  } catch (error: unknown) {
    await connection.rollback();
    console.error('Update membership error:', error);
    return { error: (error as Error).message || 'Failed to update membership' };
  } finally {
    connection.release();
  }
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // In this flow we don't return an error object, because form actions
      // must resolve to void. Client-side error reporting can be added later.
      return;
    }
    throw error;
  }
}

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  const rawPrice = formData.get('price') as string;
  let category = formData.get('category') as string;
  const otherCategory = (formData.get('other_category') as string) || '';
  const rawTags = (formData.get('tags') as string) || '';
  const description = formData.get('description') as string;
  const imageFile = formData.get('image') as File;

  if (category === 'Other') {
    category = otherCategory.trim();
  }

  const tags = rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(', ');

  if (!name || !rawPrice || !category || !description || !imageFile) {
    return { error: 'Missing fields' };
  }

  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Ensure price starts with ₱
  const price = rawPrice.startsWith('₱') ? rawPrice : `₱${rawPrice}`;

  // Server-side price validation
  const priceValidation = validatePrice(price, { min: 1, max: 10000000 });
  if (!priceValidation.isValid) {
    return { error: priceValidation.error };
  }

  try {
    let imageUrl = '';

    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const uploadResponse = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'product_thumbnails' },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result as unknown as CloudinaryUploadResult);
          }
        ).end(buffer);
      });
      
      imageUrl = uploadResponse.secure_url;
    } else {
      return { error: 'Image is required' };
    }

    // Enforce Listing Limits for Standard Users
    const [userRows] = await pool.query<UserRow[]>('SELECT account_type FROM users WHERE id = ?', [session.user.id]);
    const userTier = userRows[0]?.account_type || 'standard';

    if (userTier === 'standard') {
      const [countRows] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as count FROM products WHERE seller_id = ?', [session.user.id]);
      if (countRows[0].count >= 5) {
        return { error: 'Standard accounts are limited to 5 active listings. Upgrade to Pro for unlimited listings!' };
      }
    }

    await pool.query(
      'INSERT INTO products (name, price, category, image, description, tags, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, price, category, imageUrl, description, tags, session.user.id]
    );

    revalidatePath('/shop');
    revalidatePath('/');
    revalidatePath(`/profile/${session.user.id}`);
  } catch (error) {
    console.error('Error creating product:', error);
    return { error: 'Failed to create product' };
  }

  return { success: true };
}

export async function updateProduct(productId: number, formData: FormData) {
  const name = formData.get('name') as string;
  const rawPrice = formData.get('price') as string;
  let category = formData.get('category') as string;
  const otherCategory = (formData.get('other_category') as string) || '';
  const rawTags = (formData.get('tags') as string) || '';
  const description = formData.get('description') as string;
  const imageFile = formData.get('image') as File;

  if (category === 'Other') {
    category = otherCategory.trim();
  }

  const tags = rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
    .join(', ');

  if (!name || !rawPrice || !category || !description) {
    return { error: 'Missing fields' };
  }

  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Ensure price starts with ₱
  const price = rawPrice.startsWith('₱') ? rawPrice : `₱${rawPrice}`;

  // Server-side price validation
  const priceValidation = validatePrice(price, { min: 1, max: 10000000 });
  if (!priceValidation.isValid) {
    return { error: priceValidation.error };
  }

  try {
    // Check ownership
    const [rows] = await pool.query<ProductRow[]>(
      'SELECT seller_id, image FROM products WHERE id = ?',
      [productId]
    );

    if (rows.length === 0) {
      return { error: 'Product not found' };
    }

    if (rows[0].seller_id !== parseInt(session.user.id)) {
      return { error: 'Unauthorized' };
    }

    let imageUrl = rows[0].image;

    // Handle new image upload if provided
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const uploadResponse = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'product_thumbnails' },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result as unknown as CloudinaryUploadResult);
          }
        ).end(buffer);
      });
      
      // Optional: Delete old image from Cloudinary if it's being replaced
      if (imageUrl && imageUrl.includes('cloudinary.com')) {
        const publicId = imageUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`product_thumbnails/${publicId}`).catch(console.error);
        }
      }

      imageUrl = uploadResponse.secure_url;
    }

    await pool.query(
      'UPDATE products SET name = ?, price = ?, category = ?, image = ?, description = ?, tags = ? WHERE id = ?',
      [name, price, category, imageUrl, description, tags, productId]
    );

    revalidatePath('/shop');
    revalidatePath('/');
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/profile/${session.user.id}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { error: 'Failed to update product' };
  }
}

export async function deleteProduct(productId: number) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  try {
    // Check if the product belongs to the user and get image URL
    const [rows] = await pool.query<ProductRow[]>(
      'SELECT seller_id, image FROM products WHERE id = ?',
      [productId]
    );

    if (rows.length === 0) {
      return { error: 'Product not found' };
    }

    if (rows[0].seller_id !== parseInt(session.user.id)) {
      return { error: 'Unauthorized' };
    }

    const imageUrl = rows[0].image;

    // Delete image from Cloudinary if it exists
    if (imageUrl && imageUrl.includes('cloudinary.com')) {
      try {
        const publicId = imageUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`product_thumbnails/${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with product deletion even if image deletion fails
      }
    }

    // First delete from cart_items to avoid foreign key issues
    await pool.query('DELETE FROM cart_items WHERE product_id = ?', [productId]);

    // Then delete the product
    await pool.query('DELETE FROM products WHERE id = ?', [productId]);

    revalidatePath('/shop');
    revalidatePath('/');
    revalidatePath(`/profile/${session.user.id}`);

    return { success: true };
  } catch (error: unknown) {
    console.error('Error deleting product:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ER_ROW_IS_REFERENCED_2') {
      return { error: 'This product has already been ordered and cannot be deleted. Try updating it instead.' };
    }
    return { error: 'Failed to delete product' };
  }
}

// Helper to parse price string like "₱4,500.00" to number
function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^\d.]/g, ''));
}

export async function addToCart(productId: number) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  try {
    // Check if item already in cart
    const [existing] = await pool.query<CartItemRow[]>(
      'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [session.user.id, productId]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?',
        [existing[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)',
        [session.user.id, productId]
      );
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { error: 'Failed to add to cart' };
  }
}

export async function getCartCount(): Promise<number> {
  const session = await auth();
  if (!session || !session.user?.id) return 0;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT SUM(quantity) as count FROM cart_items WHERE user_id = ?',
      [session.user.id]
    );
    return Number(rows[0]?.count || 0);
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
}

export async function removeFromCart(cartItemId: number) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  try {
    await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartItemId, session.user.id]);
    revalidatePath('/', 'layout');
    return { success: true };
  } catch {
    return { error: 'Failed to remove from cart' };
  }
}

export async function checkout(selectedCartItemIds?: number[], paymentMethod: string = 'wallet') {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get cart items with prices
    let query = `
      SELECT ci.*, p.price as price_str, p.seller_id, p.name 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `;
    const params: (string | number | number[])[] = [session.user.id];

    if (selectedCartItemIds && selectedCartItemIds.length > 0) {
      query += ` AND ci.id IN (?) `;
      params.push(selectedCartItemIds);
    }

    const [cartItems] = await connection.query<CartItemRow[]>(query, params);

    if (cartItems.length === 0) {
      throw new Error('No items selected for checkout');
    }

    // 2. Calculate total
    let total = 0;
    for (const item of cartItems) {
      total += parsePrice(item.price_str || '0') * item.quantity;
    }

    // 3. Check buyer balance
    const [userRows] = await connection.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [session.user.id]);
    const balance = parseFloat(userRows[0].balance);

    if (balance < total) {
      throw new Error(`Insufficient balance. Total: ₱${total.toLocaleString()}, Balance: ₱${balance.toLocaleString()}`);
    }

    // 4. Deduct from buyer
    await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [total, session.user.id]);

    // 5. Create order with payment method
    const [orderResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO orders (buyer_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?)',
      [session.user.id, total, 'completed', paymentMethod]
    );
    const orderId = orderResult.insertId;

    // Log buyer purchase
    await logTransaction(
      connection,
      parseInt(session.user.id),
      'purchase',
      total,
      `Order #${orderId} (${paymentMethod})`,
      orderId
    );

    // 6. Process each item (Add to seller, Create order item)
    for (const item of cartItems) {
      const itemSubtotal = parsePrice(item.price_str || '0') * item.quantity;
      
      // Add to seller balance
      await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [itemSubtotal, item.seller_id]);

      // Record order item
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, seller_id, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.seller_id, parsePrice(item.price_str || '0'), item.quantity]
      );

      // Log seller sale
      await logTransaction(
        connection,
        item.seller_id!,
        'sale',
        itemSubtotal,
        `Sold: ${item.name} (x${item.quantity})`,
        orderId
      );
    }

    // 7. Clear processed items from cart
    if (selectedCartItemIds && selectedCartItemIds.length > 0) {
      await connection.query('DELETE FROM cart_items WHERE id IN (?) AND user_id = ?', [selectedCartItemIds, session.user.id]);
    } else {
      await connection.query('DELETE FROM cart_items WHERE user_id = ?', [session.user.id]);
    }

    await connection.commit();
    
    revalidatePath('/', 'layout');
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath('/shop');

    return { success: true, orderId };
  } catch (error: unknown) {
    await connection.rollback();
    console.error('Checkout error:', error);
    return { error: (error as Error).message || 'Checkout failed' };
  } finally {
    connection.release();
  }
}

export async function addFunds(amount: number) {
  const session = await auth();
  if (!session || !session.user?.id) return { error: 'Not authenticated' };

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, session.user.id]);

    // Log transaction
    await logTransaction(
      connection,
      parseInt(session.user.id),
      'deposit',
      amount,
      'Added funds to wallet'
    );

    await connection.commit();

    revalidatePath(`/profile/${session.user.id}`);
    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error('Add funds error:', error);
    return { error: 'Failed to add funds' };
  } finally {
    connection.release();
  }
}

export async function buyNow(productId: number, paymentMethod: string = 'wallet') {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get product details
    const [products] = await connection.query<ProductRow[]>(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0) {
      throw new Error('Product not found');
    }

    const product = products[0];
    const price = parsePrice(product.price);

    // 2. Check buyer balance
    const [userRows] = await connection.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [session.user.id]);
    const balance = parseFloat(userRows[0].balance);

    if (balance < price) {
      throw new Error(`Insufficient balance. Price: ₱${price.toLocaleString()}, Balance: ₱${balance.toLocaleString()}`);
    }

    // 3. Deduct from buyer
    await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [price, session.user.id]);

    // 4. Create order with payment method
    const [orderResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO orders (buyer_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?)',
      [session.user.id, price, 'completed', paymentMethod]
    );
    const orderId = orderResult.insertId;

    // Log buyer purchase
    await logTransaction(
      connection,
      parseInt(session.user.id),
      'purchase',
      price,
      `Purchased: ${product.name} (${paymentMethod})`,
      orderId
    );

    // 5. Add to seller balance
    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [price, product.seller_id]);

    // Log seller sale
    await logTransaction(
      connection,
      product.seller_id,
      'sale',
      price,
      `Sold: ${product.name}`,
      orderId
    );

    // 6. Record order item
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, seller_id, price, quantity) VALUES (?, ?, ?, ?, ?)',
      [orderId, product.id, product.seller_id, price, 1]
    );

    await connection.commit();
    
    revalidatePath('/', 'layout');
    revalidatePath(`/profile/${session.user.id}`);
    revalidatePath('/shop');
    revalidatePath(`/products/${productId}`);

    return { success: true, orderId };
  } catch (error: unknown) {
    await connection.rollback();
    console.error('Buy Now error:', error);
    return { error: (error as Error).message || 'Purchase failed' };
  } finally {
    connection.release();
  }
}
