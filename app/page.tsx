import pool from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { RowDataPacket } from 'mysql2';

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  seller_id: number;
  seller_tier: string;
  created_at: Date;
}

async function getProducts() {
  try {
    const [featured] = await pool.query<ProductRow[]>(`
      SELECT p.*, u.account_type as seller_tier
      FROM products p 
      INNER JOIN users u ON p.seller_id = u.id 
      WHERE u.account_type = 'pro'
      ORDER BY p.created_at DESC 
      LIMIT 4
    `);

    return { featured };
  } catch (error) {
    console.error('Database query error:', error);
    return { featured: [] };
  }
}

export default async function Home() {
  const { featured } = await getProducts();

  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 max-w-2xl">
            <span className="mb-4 inline-block text-sm font-bold uppercase tracking-widest text-blue-600">
              LuloyXpress Marketplace
            </span>
            <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-black sm:text-6xl">
              Buy and Sell with <br /> 
              <span className="text-blue-600">Confidence.</span>
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-zinc-600">
              Join our growing community of sellers. Discover unique items or list your own in minutes.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/shop" className="inline-flex h-14 items-center justify-center rounded-full bg-black px-8 text-base font-semibold text-white transition-all hover:bg-zinc-800">
                Explore Shop
              </Link>
              <Link href="/sell" className="inline-flex h-14 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-base font-semibold text-black transition-all hover:bg-zinc-50">
                Start Selling
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 hidden h-full w-1/2 lg:block">
          <div className="h-full w-full bg-gradient-to-l from-blue-50 to-transparent"></div>
        </div>
      </section>

      {/* Featured Products (Pro Only) */}
      {featured.length > 0 && (
        <section className="py-24 bg-zinc-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <span className="text-blue-600 font-bold text-sm uppercase tracking-widest">Featured Listings</span>
              <h2 className="text-3xl font-bold tracking-tight text-black mt-2">Premium Picks</h2>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
              {featured.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="group cursor-pointer block">
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-3xl bg-white shadow-sm border border-zinc-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Featured</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start gap-2 overflow-hidden">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{product.category}</p>
                      <h3 className="mt-1 text-base font-semibold text-black truncate">{product.name}</h3>
                    </div>
                    <p className="mt-1 text-sm font-bold text-blue-600 whitespace-nowrap">{product.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8 flex flex-col items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-6 w-6 overflow-hidden rounded">
              <Image 
                src="/logo.png" 
                alt="LuloyXpress Logo" 
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm font-bold tracking-tighter text-black uppercase">
              Luloy<span className="text-blue-600">Xpress</span>
            </span>
          </Link>
          <p className="text-sm text-zinc-500">
            &copy; 2026 LuloyXpress. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
