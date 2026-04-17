import { auth } from "@/auth";
import pool from "@/lib/db";
import { redirect } from "next/navigation";
import { RowDataPacket } from "mysql2";
import CartClient from "@/components/CartClient";

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

  return (
    <div className="min-h-screen bg-zinc-50 font-sans py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-zinc-900 mb-8">Your Shopping Cart</h1>
        <CartClient 
          cartItems={cartItems} 
          balance={balance} 
        />
      </div>
    </div>
  );
}
