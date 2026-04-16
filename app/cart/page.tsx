import { auth } from "@/auth";
import pool from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { removeFromCart, checkout } from "@/lib/actions";
import { RowDataPacket } from "mysql2";

interface CartItemRow extends RowDataPacket {
  cart_item_id: number;
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  quantity: number;
}

interface UserBalanceRow extends RowDataPacket {
  balance: string;
}

async function getCartItems(userId: string) {
  try {
    const [rows] = await pool.query<CartItemRow[]>(`
      SELECT ci.id as cart_item_id, ci.quantity, p.* 
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [userId]);
    return rows;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
}

async function getUserBalance(userId: string) {
  try {
    const [rows] = await pool.query<UserBalanceRow[]>("SELECT balance FROM users WHERE id = ?", [userId]);
    return rows[0]?.balance || "0";
  } catch (error) {
    console.error("Error fetching balance:", error);
    return "0";
  }
}

export default async function CartPage() {
  const session = await auth();
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const cartItems = await getCartItems(session.user.id);
  const balance = await getUserBalance(session.user.id);

  const total = cartItems.reduce((acc: number, item: CartItemRow) => {
    const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
    return acc + (price * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 mb-8">Your Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200">
                <div className="mb-4 flex justify-center text-zinc-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 mb-2">Your cart is empty</h2>
                <p className="text-zinc-500 mb-6">Looks like you haven\u0027t added anything to your cart yet.</p>
                <Link href="/shop" className="inline-block rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors">
                  Start Shopping
                </Link>
              </div>
            ) : (
              cartItems.map((item: CartItemRow) => (
                <div key={item.cart_item_id} className="bg-white rounded-2xl p-4 border border-zinc-200 flex gap-4">
                  <div className="h-24 w-24 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 relative">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-zinc-900">{item.name}</h3>
                      <p className="text-sm text-zinc-500">{item.category}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-blue-600">{item.price} x {item.quantity}</p>
                      <form action={async () => {
                        'use server';
                        await removeFromCart(item.cart_item_id);
                      }}>
                        <button className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider">
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Order Summary</h2>
              <div className="space-y-3 pb-4 border-b border-zinc-100">
                <div className="flex justify-between text-zinc-600">
                  <span>Subtotal</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
              </div>
              <div className="pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-zinc-900 font-bold">Total</span>
                  <span className="text-2xl font-black text-zinc-900">₱{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Your Balance</span>
                  <Link href={`/profile/${session.user.id}`} className="text-[10px] font-bold text-blue-600 hover:underline">Add Funds</Link>
                </div>
                <div className="text-lg font-bold text-zinc-900">₱{parseFloat(balance).toLocaleString()}</div>
              </div>

              {cartItems.length > 0 && (
                <form 
                  action={async () => {
                    'use server';
                    const result = await checkout();
                    if (result.success && session?.user?.id) {
                      redirect(`/profile/${session.user.id}?checkout=success`);
                    } else if (result.error) {
                      // We can't use alert in a server component action directly like this if it's purely server-side,
                      // but in Next.js 15, these functions are converted to client-callable actions.
                      // For better UX, normally we'd use useActionState, but this should fix the type error.
                    }
                  }}
                >
                  <button 
                    disabled={parseFloat(balance) < total}
                    className="w-full rounded-full bg-black py-4 text-base font-bold text-white transition-all hover:bg-zinc-800 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {parseFloat(balance) < total ? 'Insufficient Balance' : 'Complete Purchase'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
