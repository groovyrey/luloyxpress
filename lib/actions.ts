'use server';

import { cache } from 'react';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';
import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import { revalidatePath } from 'next/cache';
import cloudinary from '@/lib/cloudinary';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { PoolConnection } from 'mysql2/promise';
import { validatePrice, parsePriceToDecimal, formatPrice } from '@/lib/currency';
import { ably } from '@/lib/ably';

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

interface OrderRow extends RowDataPacket {
  id: number;
  buyer_id: number;
  total_amount: string;
  status: string;
  payment_method: string;
  created_at: Date;
}

interface OrderItemRow extends RowDataPacket {
  id: number;
  order_id: number;
  product_id: number;
  seller_id: number;
  product_name_at_purchase: string;
  price: string;
  quantity: number;
}

export interface ReviewRow extends RowDataPacket {
  id: number;
  order_id: number;
  product_id: number;
  reviewer_id: number;
  reviewer_name: string;
  seller_id: number;
  rating: number;
  comment: string;
  created_at: Date;
}

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function register(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { error: 'Missing fields' };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user exists
    const [existing] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return { error: 'User already exists' };
    }

    await pool.query(
      'INSERT INTO users (name, email, password, account_type) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'standard']
    );
    
    return { success: true };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Registration failed' };
  }
}

async function logTransaction(
  connection: PoolConnection,
  userId: number,
  type: 'deposit' | 'purchase' | 'sale' | 'membership_fee' | 'withdrawal',
  amount: string | number,
  description: string,
  referenceId?: number
) {
  const amountNum = parsePriceToDecimal(amount);
  await connection.query(
    'INSERT INTO transactions (user_id, type, amount, description, reference_id) VALUES (?, ?, ?, ?, ?)',
    [userId, type, amountNum.toFixed(2), description, referenceId || null]
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
      const balance = parsePriceToDecimal(currentUser.balance);

      if (balance < proCost) {
        throw new Error(`Insufficient balance for Pro upgrade. Cost: ₱${proCost.toFixed(2)}, Current Balance: ₱${formatPrice(balance)}`);
      }

      // Deduct from balance
      await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [proCost.toFixed(2), session.user.id]);

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

export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/',
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials' };
        default:
          return { error: 'Something went wrong.' };
      }
    }
    throw error;
  }
}

export async function createProduct(prevState: ActionState, formData: FormData): Promise<ActionState> {
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

  // Parse price to numeric value for DECIMAL field
  const price = parsePriceToDecimal(rawPrice).toFixed(2);

  // Server-side price validation
  const priceValidation = validatePrice(rawPrice, { min: 1, max: 10000000 });
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
    
    return { success: true };
  } catch (error) {
    console.error('Error creating product:', error);
    return { error: 'Failed to create product' };
  }
}

export async function updateProduct(productId: number, prevState: ActionState, formData: FormData): Promise<ActionState> {
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

  // Parse price to numeric value for DECIMAL field
  const price = parsePriceToDecimal(rawPrice).toFixed(2);

  // Server-side price validation
  const priceValidation = validatePrice(rawPrice, { min: 1, max: 10000000 });
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

    // First delete from reviews and cart_items to avoid foreign key issues
    // (Though ON DELETE CASCADE should handle this if schema was updated)
    await pool.query('DELETE FROM reviews WHERE product_id = ?', [productId]);
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

    const count = await getCartCount();
    const channel = ably.channels.get(`user:${session.user.id}`);
    channel.publish('cart_update', { count });

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { error: 'Failed to add to cart' };
  }
}

export const getCartCount = cache(async (): Promise<number> => {
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
});

export async function removeFromCart(cartItemId: number) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return { error: 'Not authenticated' };
  }

  try {
    await pool.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartItemId, session.user.id]);
    
    const count = await getCartCount();
    const channel = ably.channels.get(`user:${session.user.id}`);
    channel.publish('cart_update', { count });

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
      const itemPrice = parsePriceToDecimal(item.price_str || '0');
      total += itemPrice * item.quantity;
    }

    // 3. Check buyer balance
    const [userRows] = await connection.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [session.user.id]);
    const balance = parsePriceToDecimal(userRows[0].balance);

    if (balance < total) {
      throw new Error(`Insufficient balance. Total: ₱${total.toFixed(2)}, Balance: ₱${formatPrice(balance)}`);
    }

    // 4. Deduct from buyer
    await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [total.toFixed(2), session.user.id]);

    // 5. Create order with payment method
    const [orderResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO orders (buyer_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?)',
      [session.user.id, total.toFixed(2), 'completed', paymentMethod]
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
      const itemPrice = parsePriceToDecimal(item.price_str || '0');
      const itemSubtotal = itemPrice * item.quantity;
      
      // Add to seller balance
      await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [itemSubtotal.toFixed(2), item.seller_id]);

      // Record order item
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, seller_id, product_name_at_purchase, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.seller_id, item.name, itemPrice.toFixed(2), item.quantity]
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

      // Notify seller of balance update
      const sellerChannel = ably.channels.get(`user:${item.seller_id}`);
      const [sellerRows] = await connection.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [item.seller_id]);
      sellerChannel.publish('balance_update', { balance: sellerRows[0].balance });
    }

    // 7. Clear processed items from cart
    if (selectedCartItemIds && selectedCartItemIds.length > 0) {
      await connection.query('DELETE FROM cart_items WHERE id IN (?) AND user_id = ?', [selectedCartItemIds, session.user.id]);
    } else {
      await connection.query('DELETE FROM cart_items WHERE user_id = ?', [session.user.id]);
    }

    await connection.commit();

    // Notify buyer of balance and cart update
    const buyerChannel = ably.channels.get(`user:${session.user.id}`);
    const [updatedBuyerRows] = await pool.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [session.user.id]);
    buyerChannel.publish('balance_update', { balance: updatedBuyerRows[0].balance });
    
    const count = await getCartCount();
    buyerChannel.publish('cart_update', { count });
    
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

  if (amount < 500) return { error: 'Minimum top-up is ₱500' };
  if (amount > 1000000) return { error: 'Maximum top-up is ₱1,000,000' };

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const decimalAmount = amount.toFixed(2);
    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [decimalAmount, session.user.id]);

    // Log transaction
    await logTransaction(
      connection,
      parseInt(session.user.id),
      'deposit',
      decimalAmount,
      'Added funds to wallet'
    );

    await connection.commit();

    // Notify user of balance update
    const [userRows] = await pool.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [session.user.id]);
    const channel = ably.channels.get(`user:${session.user.id}`);
    channel.publish('balance_update', { balance: userRows[0].balance });

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
    const price = parsePriceToDecimal(product.price);

    // 2. Check buyer balance
    const [userRows] = await connection.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [session.user.id]);
    const balance = parsePriceToDecimal(userRows[0].balance);

    if (balance < price) {
      throw new Error(`Insufficient balance. Price: ₱${price.toFixed(2)}, Balance: ₱${formatPrice(balance)}`);
    }

    // 3. Deduct from buyer
    await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [price.toFixed(2), session.user.id]);

    // 4. Create order with payment method
    const [orderResult] = await connection.query<ResultSetHeader>(
      'INSERT INTO orders (buyer_id, total_amount, status, payment_method) VALUES (?, ?, ?, ?)',
      [session.user.id, price.toFixed(2), 'completed', paymentMethod]
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
    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [price.toFixed(2), product.seller_id]);

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
      'INSERT INTO order_items (order_id, product_id, seller_id, product_name_at_purchase, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, product.id, product.seller_id, product.name, price.toFixed(2), 1]
    );

    await connection.commit();

    // Notify buyer
    const buyerChannel = ably.channels.get(`user:${session.user.id}`);
    const [updatedBuyerRows] = await pool.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [session.user.id]);
    buyerChannel.publish('balance_update', { balance: updatedBuyerRows[0].balance });

    // Notify seller
    const sellerChannel = ably.channels.get(`user:${product.seller_id}`);
    const [sellerRows] = await pool.query<UserRow[]>('SELECT balance FROM users WHERE id = ?', [product.seller_id]);
    sellerChannel.publish('balance_update', { balance: sellerRows[0].balance });
    
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

export async function deleteMessage(messageId: number, receiverId: number) {
  const session = await auth();
  if (!session || !session.user?.id) return { error: 'Not authenticated' };

  try {
    // Verify ownership before deleting
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT sender_id FROM messages WHERE id = ?',
      [messageId]
    );

    if (rows.length === 0) return { error: 'Message not found' };
    if (rows[0].sender_id !== parseInt(session.user.id)) return { error: 'Unauthorized' };

    await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);

    // Notify receiver via Ably to remove message from UI
    const chatChannel = ably.channels.get(
      `chat:${[session.user.id, receiverId.toString()].sort().join('-')}`
    );
    chatChannel.publish('message_delete', { messageId });

    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    return { error: 'Failed to delete message' };
  }
}

export interface Message extends RowDataPacket {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string | Date;
}

export async function sendMessage(receiverId: number, content: string) {
  const session = await auth();
  if (!session || !session.user?.id) return { error: 'Not authenticated' };

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [session.user.id, receiverId, content]
    );

    const newMessage = {
      id: result.insertId,
      sender_id: parseInt(session.user.id),
      receiver_id: receiverId,
      content,
      created_at: new Date()
    };

    // Notify receiver via their personal channel for global notifications
    const receiverChannel = ably.channels.get(`user:${receiverId}`);
    receiverChannel.publish('new_message', { 
      senderId: session.user.id, 
      senderName: session.user.name,
      content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
    });

    // Enforce 20-message limit: Delete everything except the 20 most recent
    await pool.query(
      `DELETE FROM messages 
       WHERE id IN (
         SELECT id FROM (
           SELECT id FROM messages 
           WHERE (sender_id = ? AND receiver_id = ?) 
              OR (sender_id = ? AND receiver_id = ?)
           ORDER BY created_at DESC, id DESC
           LIMIT 1000 OFFSET 20
         ) as t
       )`,
      [session.user.id, receiverId, receiverId, session.user.id]
    );

    return { success: true, message: newMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    return { error: 'Failed to send message' };
  }
}

export async function getMessages(otherUserId: number): Promise<Message[]> {
  const session = await auth();
  if (!session || !session.user?.id) return [];

  try {
    const [rows] = await pool.query<Message[]>(
      `SELECT * FROM messages 
       WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)
       ORDER BY created_at ASC`,
      [session.user.id, otherUserId, otherUserId, session.user.id]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export const getConversations = cache(async () => {
  const session = await auth();
  if (!session || !session.user?.id) return [];

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT DISTINCT 
        u.id, u.name, u.email,
        (SELECT content FROM messages 
         WHERE (sender_id = u.id AND receiver_id = ?) 
            OR (sender_id = ? AND receiver_id = u.id)
         ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT sender_id FROM messages 
         WHERE (sender_id = u.id AND receiver_id = ?) 
            OR (sender_id = ? AND receiver_id = u.id)
         ORDER BY created_at DESC LIMIT 1) as last_sender_id,
        (SELECT created_at FROM messages 
         WHERE (sender_id = u.id AND receiver_id = ?) 
            OR (sender_id = ? AND receiver_id = u.id)
         ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM users u
      JOIN messages m ON (u.id = m.sender_id OR u.id = m.receiver_id)
      WHERE u.id != ? AND (m.sender_id = ? OR m.receiver_id = ?)
      ORDER BY last_message_at DESC`,
      [session.user.id, session.user.id, session.user.id, session.user.id, session.user.id, session.user.id, session.user.id, session.user.id, session.user.id]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
});

export async function createReview(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || !session.user?.id) return { error: 'Not authenticated' };

  const orderId = formData.get('order_id') as string;
  const productId = formData.get('product_id') as string;
  const rating = parseInt(formData.get('rating') as string);
  const comment = formData.get('comment') as string;

  if (!orderId || !productId || !rating || isNaN(rating) || rating < 1 || rating > 5) {
    return { error: 'Invalid rating data' };
  }

  try {
    // 1. Get order and verify ownership
    const [orders] = await pool.query<OrderRow[]>(
      'SELECT buyer_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) return { error: 'Order not found' };
    if (orders[0].buyer_id !== parseInt(session.user.id)) return { error: 'Unauthorized' };

    // 2. Verify product is in order and get seller_id
    const [orderItems] = await pool.query<OrderItemRow[]>(
      'SELECT seller_id FROM order_items WHERE order_id = ? AND product_id = ? LIMIT 1',
      [orderId, productId]
    );
    
    if (orderItems.length === 0) return { error: 'Product not found in this order' };
    const sellerId = orderItems[0].seller_id;

    // 3. Insert review
    await pool.query(
      'INSERT INTO reviews (order_id, product_id, reviewer_id, seller_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, productId, session.user.id, sellerId, rating, comment]
    );

    revalidatePath(`/products/${productId}`);
    revalidatePath(`/profile/${sellerId}`);
    revalidatePath(`/receipt/${orderId}`);
    
    return { success: true };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
      return { error: 'You have already reviewed this product' };
    }
    console.error('Error creating review:', error);
    return { error: 'Failed to submit review' };
  }
}

export const getProductReviews = cache(async (productId: string): Promise<ReviewRow[]> => {
  try {
    const [rows] = await pool.query<ReviewRow[]>(
      `SELECT r.*, u.name as reviewer_name 
       FROM reviews r 
       JOIN users u ON r.reviewer_id = u.id 
       WHERE r.product_id = ? 
       ORDER BY r.created_at DESC`,
      [productId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
});

export const getProductRating = cache(async (productId: string) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE product_id = ?',
      [productId]
    );
    return {
      average: parseFloat(rows[0].average || '0'),
      count: rows[0].count || 0
    };
  } catch (error) {
    console.error('Error fetching product rating:', error);
    return { average: 0, count: 0 };
  }
});

export const getSellerReviews = cache(async (sellerId: string): Promise<(ReviewRow & { product_name: string })[]> => {
  try {
    const [rows] = await pool.query<(ReviewRow & { product_name: string })[]>(
      `SELECT r.*, u.name as reviewer_name, p.name as product_name
       FROM reviews r 
       JOIN users u ON r.reviewer_id = u.id 
       JOIN products p ON r.product_id = p.id
       WHERE r.seller_id = ? 
       ORDER BY r.created_at DESC`,
      [sellerId]
    );
    return rows;
  } catch (error) {
    console.error('Error fetching seller reviews:', error);
    return [];
  }
});

export const getSellerRating = cache(async (sellerId: string) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT AVG(rating) as average, COUNT(*) as count FROM reviews WHERE seller_id = ?',
      [sellerId]
    );
    return {
      average: parseFloat(rows[0].average || '0'),
      count: rows[0].count || 0
    };
  } catch (error) {
    console.error('Error fetching seller rating:', error);
    return { average: 0, count: 0 };
  }
});

export const getReviewForOrder = cache(async (orderId: number, productId?: number): Promise<ReviewRow | null> => {
  try {
    let query = 'SELECT * FROM reviews WHERE order_id = ?';
    const params: (number | string)[] = [orderId];
    
    if (productId) {
      query += ' AND product_id = ?';
      params.push(productId);
    }

    const [rows] = await pool.query<ReviewRow[]>(query, params);
    return rows[0] || null;
  } catch {
    return null;
  }
});

export const getEligibleOrderForReview = cache(async (userId: string, productId: string): Promise<number | null> => {
  try {
    // 1. Check if the user has already reviewed this product (any order)
    const [existingReviews] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM reviews WHERE reviewer_id = ? AND product_id = ? LIMIT 1',
      [userId, productId]
    );
    
    if (existingReviews.length > 0) {
      return null;
    }

    // 2. Find a completed order that contains this product
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT oi.order_id 
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE o.buyer_id = ? AND oi.product_id = ? AND o.status = 'completed'
       LIMIT 1`,
      [userId, productId]
    );
    return rows[0]?.order_id || null;
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return null;
  }
});
