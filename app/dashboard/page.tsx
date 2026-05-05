import { auth } from "@/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import DashboardClient from "@/components/DashboardClient";

async function getDashboardData(userId: string) {
  try {
    // Get user basic info
    const [userRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, email, balance, account_type FROM users WHERE id = ?",
      [userId]
    );
    const user = userRows[0];

    // Get seller stats
    const [sellerStatsRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         COALESCE(SUM(price * quantity), 0) as total_revenue,
         COUNT(*) as total_sales
       FROM order_items
       WHERE seller_id = ?`,
      [userId]
    );
    const sellerStats = sellerStatsRows[0];

    // Get active listings count
    const [listingsRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM products WHERE seller_id = ?",
      [userId]
    );
    const activeListings = listingsRows[0].total;

    // Get total purchases count
    const [purchasesRows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM orders WHERE buyer_id = ?",
      [userId]
    );
    const totalPurchases = purchasesRows[0].total;

    // Get recent wallet transactions
    const [txRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [userId]
    );

    // Get recent sales
    const [salesRows] = await pool.query<RowDataPacket[]>(
      `SELECT oi.order_id, p.name as product_name, oi.price, oi.quantity, o.created_at
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ?
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        balance: user.balance,
        account_type: user.account_type
      },
      stats: {
        totalRevenue: sellerStats.total_revenue,
        totalSales: sellerStats.total_sales,
        activeListings,
        totalPurchases
      },
      recentTransactions: txRows,
      recentSales: salesRows
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const data = await getDashboardData(session.user.id);

  if (!data) {
    redirect('/shop');
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <DashboardClient 
          user={data.user}
          stats={data.stats}
          recentTransactions={data.recentTransactions}
          recentSales={data.recentSales}
        />
      </div>
    </div>
  );
}
