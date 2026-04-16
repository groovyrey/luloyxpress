import { auth } from "@/auth";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import AddFundsButton from "@/components/AddFundsButton";
import DeleteProductButton from "@/components/DeleteProductButton";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  account_type: string;
  balance: string;
  created_at: Date;
}

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  seller_id: number;
}

interface TransactionRow extends RowDataPacket {
  order_id: number;
  total_amount: string;
  status: string;
  created_at: Date;
}

interface OrderItemRow extends RowDataPacket {
  order_id: number;
  product_name: string;
  price: string;
  quantity: number;
}

interface SalesRow extends RowDataPacket {
  total_revenue: string;
  total_sales: number;
}

interface SaleItemRow extends RowDataPacket {
  order_id: number;
  product_name: string;
  price: string;
  quantity: number;
  created_at: Date;
}

async function getUserProducts(userId: string) {
  try {
    const [rows] = await pool.query<ProductRow[]>(
      "SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching user products:", error);
    return [];
  }
}

async function getFullUser(userId: string) {
  try {
    const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE id = ?", [userId]);
    return rows[0];
  } catch (error) {
    console.error("Error fetching full user data:", error);
    return null;
  }
}

async function getUserTransactions(userId: string) {
  try {
    const [rows] = await pool.query<TransactionRow[]>(
      `SELECT o.id as order_id, o.total_amount, o.status, o.created_at
       FROM orders o
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

async function getOrderItems(orderIds: number[]) {
  if (orderIds.length === 0) return [];
  try {
    const [rows] = await pool.query<OrderItemRow[]>(
      `SELECT oi.order_id, p.name as product_name, oi.price, oi.quantity
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching order items:", error);
    return [];
  }
}

async function getSellerStats(userId: string) {
  try {
    const [rows] = await pool.query<SalesRow[]>(
      `SELECT 
         COALESCE(SUM(price * quantity), 0) as total_revenue,
         COUNT(*) as total_sales
       FROM order_items
       WHERE seller_id = ?`,
      [userId]
    );
    return rows[0];
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return { total_revenue: "0", total_sales: 0 };
  }
}

async function getRecentSales(userId: string) {
  try {
    const [rows] = await pool.query<SaleItemRow[]>(
      `SELECT oi.order_id, p.name as product_name, oi.price, oi.quantity, o.created_at
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error("Error fetching recent sales:", error);
    return [];
  }
}


function CheckoutSuccessMessage() {
  return (
    <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-8 flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div>
        <p className="text-sm font-bold text-green-900">Purchase Successful!</p>
        <p className="text-xs text-green-700">Your items are on their way. Thank you for shopping with LuloyXpress!</p>
      </div>
    </div>
  );
}

export default async function ProfilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ checkout?: string }> 
}) {
  const { id } = await params;
  const { checkout } = await searchParams;
  const session = await auth();
  
  const dbUser = await getFullUser(id);
  if (!dbUser) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === id;
  const userProducts = await getUserProducts(id);
  const transactions = isOwnProfile ? await getUserTransactions(id) : [];
  const orderIds = transactions.map(t => t.order_id);
  const allOrderItems = await getOrderItems(orderIds);
  const sellerStats = isOwnProfile ? await getSellerStats(id) : null;
  const recentSales = isOwnProfile ? await getRecentSales(id) : [];

  return (
    <div className="min-h-screen bg-white font-sans">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Checkout Success Message */}
          {isOwnProfile && checkout === 'success' && <CheckoutSuccessMessage />}

          {/* Profile Card */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold uppercase">
                  {dbUser.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-zinc-900">{dbUser.name}</h1>
                    {dbUser.account_type === 'pro' && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 uppercase border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Verified Seller
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500">{isOwnProfile ? dbUser.email : "Community Member"}</p>
                </div>
              </div>

              {isOwnProfile && (
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 min-w-[200px]">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Account Balance</p>
                  <p className="text-2xl font-black text-blue-600">₱{parseFloat(dbUser.balance).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Seller Details</h3>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-zinc-600">
                    <span className="font-medium text-zinc-900">Member since:</span> {new Date(dbUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-zinc-600">
                    <span className="font-medium text-zinc-900">Listings:</span> {userProducts.length} items
                  </p>
                </div>
              </div>
              {isOwnProfile && (
                <div className="flex flex-col justify-end gap-3">
                  <AddFundsButton />
                  <Link href="/membership" className="w-full text-center rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white hover:bg-black transition-colors">
                    Manage Membership
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Seller Dashboard for own profile */}
          {isOwnProfile && sellerStats && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900 mb-6">Seller Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Revenue</p>
                  <p className="text-3xl font-black text-blue-600">₱{parseFloat(sellerStats.total_revenue).toLocaleString()}</p>
                  <p className="mt-2 text-xs text-blue-500 font-medium">Earnings from successful sales</p>
                </div>
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Sales</p>
                  <p className="text-3xl font-black text-zinc-900">{sellerStats.total_sales}</p>
                  <p className="mt-2 text-xs text-zinc-500 font-medium">Number of items sold</p>
                </div>
              </div>

              {recentSales.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Recent Sales</h3>
                  <div className="space-y-3">
                    {recentSales.map((sale, idx) => (
                      <div key={`sale-${idx}`} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/30">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            #{sale.order_id}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{sale.product_name}</p>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase">{new Date(sale.created_at).toLocaleDateString()} • Qty: {sale.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-zinc-900">₱{parseFloat(sale.price).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Transactions section for own profile */}
          {isOwnProfile && (
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900 mb-6">Recent Purchases</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-zinc-100 rounded-xl">
                  <p className="text-zinc-500">No purchases yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {transactions.map((t) => (
                    <div key={t.order_id} className="p-6 rounded-2xl border border-zinc-100 bg-zinc-50/50">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-100">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">Order #{t.order_id}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-blue-600">₱{parseFloat(t.total_amount).toLocaleString()}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            {t.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {allOrderItems
                          .filter(item => item.order_id === t.order_id)
                          .map((item, idx) => (
                            <div key={`item-${idx}`} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="h-5 w-5 rounded bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                                  {item.quantity}x
                                </span>
                                <span className="font-medium text-zinc-700">{item.product_name}</span>
                              </div>
                              <p className="text-zinc-500 italic">₱{parseFloat(item.price).toLocaleString()} / unit</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* User's Listings */}
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-zinc-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-zinc-900">
                {isOwnProfile ? "Your Listings" : `${dbUser.name.split(' ')[0]}\u0027s Listings`}
              </h2>
              {isOwnProfile && (
                <Link href="/sell" className="text-sm font-bold text-blue-600 hover:text-blue-700">
                  + Add New
                </Link>
              )}
            </div>
            
            {userProducts.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-zinc-100 rounded-xl">
                <p className="text-zinc-500">{isOwnProfile ? "You haven\u0027t listed any products yet." : "This seller has no active listings."}</p>
                {isOwnProfile && <Link href="/sell" className="mt-4 inline-block text-sm font-bold text-blue-600">Start selling today</Link>}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {userProducts.map((product) => (
                  <div key={product.id} className="relative group">
                    <Link href={`/products/${product.id}`} className="border border-zinc-100 rounded-xl overflow-hidden p-3 transition-hover hover:border-blue-100 block">
                      <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-white relative">
                        <Image 
                          src={product.image} 
                          alt={product.name} 
                          fill 
                          className="object-contain group-hover:scale-105 transition-transform duration-500" 
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 truncate">{product.name}</h3>
                        <p className="text-xs text-zinc-500 mb-2">{product.category}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-blue-600">{product.price}</span>
                          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded uppercase">Available</span>
                        </div>
                      </div>
                    </Link>
                    {isOwnProfile && <DeleteProductButton productId={product.id} />}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
