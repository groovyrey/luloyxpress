import pool from "@/lib/db";
import Link from "next/link";

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
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.id} className="group block">
                <Link href={`/products/${product.id}`} className="cursor-pointer">
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-zinc-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">New</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 translate-y-12 rounded-xl bg-white/90 py-3 text-sm font-bold text-black opacity-0 backdrop-blur-sm transition-all group-hover:translate-y-0 group-hover:opacity-100 text-center">
                      View Details
                    </div>
                  </div>
                </Link>
                <div>
                  <div className="flex justify-between items-start">
                    <Link href={`/products/${product.id}`} className="hover:text-blue-600 transition-colors">
                      <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{product.category}</p>
                        <h3 className="mt-1 text-base font-semibold text-black">{product.name}</h3>
                      </div>
                    </Link>
                    <p className="text-sm font-bold text-blue-600">{product.price}</p>
                  </div>
                  {product.seller_name && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-zinc-400">
                        Seller: {" "}
                        {product.seller_id ? (
                          <Link href={`/profile/${product.seller_id}`} className="text-zinc-600 font-medium hover:text-blue-600 transition-colors">
                            {product.seller_name}
                          </Link>
                        ) : (
                          <span className="text-zinc-600 font-medium">{product.seller_name}</span>
                        )}
                      </p>
                      {product.seller_tier === 'pro' && (
                        <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase border border-blue-100">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
