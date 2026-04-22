import pool from "@/lib/db";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";

async function getNewArrivals() {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, u.name as seller_name, u.account_type as seller_tier
      FROM products p 
      LEFT JOIN users u ON p.seller_id = u.id 
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    return rows as any[];
  } catch (error) {
    console.error("Database query error:", error);
    return [];
  }
}

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return (
    <div className="min-h-screen bg-white font-sans py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">Fresh Collection</span>
          <h1 className="text-4xl font-bold tracking-tight text-black mt-2">New Arrivals</h1>
          <p className="mt-4 text-lg text-zinc-600">The latest items listed by our community in the last few days.</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-medium text-zinc-900">No new arrivals yet.</h3>
            <p className="mt-2 text-zinc-500">Check back later for fresh listings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                featured={false} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
