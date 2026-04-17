import { auth } from "@/auth";
import NavbarClient from "./NavbarClient";
import { getCartCount } from "@/lib/actions";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import LiveUpdatesProvider from "./LiveUpdatesProvider";

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
  const cartCount = await getCartCount();
  const balance = session?.user?.id ? await getUserBalance(session.user.id) : "0";

  return (
    <LiveUpdatesProvider 
      userId={session?.user?.id} 
      initialCartCount={cartCount} 
      initialBalance={balance}
    >
      <NavbarClient session={session} />
    </LiveUpdatesProvider>
  );
}
