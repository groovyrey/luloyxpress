import { auth } from "@/auth";
import NavbarClient from "./NavbarClient";
import { getCartCount } from "@/lib/actions";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

async function getUserBalance(userId: string) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT balance FROM users WHERE id = ?", [userId]);
    return rows[0]?.balance || "0";
  } catch {
    return "0";
  }
}

export default async function Navbar() {
  const session = await auth();
  const cartCountPromise = getCartCount();
  const balancePromise = session?.user?.id ? getUserBalance(session.user.id) : Promise.resolve("0");

  const [cartCount, balance] = await Promise.all([cartCountPromise, balancePromise]);

  return <NavbarClient session={session} initialCartCount={cartCount} initialBalance={balance} />;
}
