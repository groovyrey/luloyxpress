import pool from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { RowDataPacket } from "mysql2";

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  seller_id: number;
  seller_name: string;
  seller_tier: string;
  created_at: Date;
}

async function getProducts(category?: string, search?: string) {
  try {
    let query = `
      SELECT p.*, u.name as seller_name, u.account_type as seller_tier
      FROM products p 
      LEFT JOIN users u ON p.seller_id = u.id 
      WHERE 1=1 
    `;
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ` AND p.category = ? `;
      params.push(category);
    }

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?) `;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += `
      ORDER BY 
        CASE WHEN u.account_type = 'pro' THEN 0 ELSE 1 END,
        p.created_at DESC
    `;

    const [rows] = await pool.query<ProductRow[]>(query, params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    return [];
  }
}

async function getUniqueCategories() {
  try {
    const [rows]: any = await pool.query("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ''");
    return rows.map((r: any) => r.category) as string[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

function ProductCard({ product }: { product: ProductRow }) {
  const isVerifiedSeller = product.seller_tier?.toLowerCase() === 'pro';

  return (
    <div className="group block h-full">
      <Link href={`/products/${product.id}`} className="cursor-pointer block">
        <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-zinc-100">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-xl bg-white/90 px-6 py-3 text-sm font-bold text-black backdrop-blur-sm shadow-xl">
              View Details
            </div>
          </div>
        </div>
      </Link>
      <div>
        <div className="flex justify-between items-start gap-2">
          <Link href={`/products/${product.id}`} className="hover:text-blue-600 transition-colors flex-1 min-w-0">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.category}</p>
              <h3 className="mt-1 text-base font-semibold text-black truncate">{product.name}</h3>
            </div>
          </Link>
          <p className="text-sm font-bold text-blue-600 whitespace-nowrap">{product.price}</p>
        </div>
        {product.seller_name && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-zinc-400 truncate">
              Seller: {" "}
              {product.seller_id ? (
                <Link href={`/profile/${product.seller_id}`} className="text-zinc-600 font-medium hover:text-blue-600 transition-colors">
                  {product.seller_name}
                </Link>
              ) : (
                <span className="text-zinc-600 font-medium">{product.seller_name}</span>
              )}
            </p>
            {isVerifiedSeller && (
              <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600 uppercase border border-blue-100 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Verified Seller
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category: selectedCategory, q: searchQuery } = await searchParams;
  const categories = await getUniqueCategories();
  const allProducts = await getProducts(selectedCategory, searchQuery);

  // Grouping products by category if no specific category is selected and no search query
  const productsByCategory: Record<string, ProductRow[]> = {};
  const showSections = (!selectedCategory || selectedCategory === 'All') && !searchQuery;

  if (showSections) {
    allProducts.forEach(product => {
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      productsByCategory[product.category].push(product);
    });
  }

  const activeCategories = ['All', ...categories];

  return (
    <div className="min-h-screen bg-white font-sans py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-black mb-4">
              {searchQuery ? `Search: ${searchQuery}` : (selectedCategory && selectedCategory !== 'All' ? selectedCategory : 'Shop All')}
            </h1>
            <p className="text-xl text-zinc-500 max-w-2xl leading-relaxed">
              {searchQuery ? `Found ${allProducts.length} items matching your search.` : 'Browse high-quality listings from our verified community of sellers.'}
            </p>
          </div>
          
          <div className="w-full md:w-96">
            <form action="/shop" method="GET" className="relative group">
              <input 
                type="text"
                name="q"
                defaultValue={searchQuery || ''}
                placeholder="Search products..."
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-4 pl-14 text-sm font-medium text-black focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-600 transition-colors">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              {selectedCategory && selectedCategory !== 'All' && <input type="hidden" name="category" value={selectedCategory} />}
            </form>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-2">
            {activeCategories.map((cat) => (
              <Link
                key={cat}
                href={`/shop?${new URLSearchParams({
                  ...(cat !== 'All' ? { category: cat } : {}),
                  ...(searchQuery ? { q: searchQuery } : {})
                }).toString()}`}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap border ${
                  (selectedCategory === cat || (!selectedCategory && cat === 'All'))
                    ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-200 scale-105'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900'
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {allProducts.length === 0 ? (
          <div className="text-center py-32 bg-zinc-50 rounded-3xl border-2 border-dashed border-zinc-100">
            <h3 className="text-2xl font-bold text-zinc-900">{searchQuery ? 'No matches found' : 'No items available'}</h3>
            <p className="mt-2 text-zinc-500 max-w-xs mx-auto">
              {searchQuery ? `We couldn't find anything for "${searchQuery}". Try different keywords.` : 'There are currently no products in this category. Check back soon or list your own!'}
            </p>
            {searchQuery ? (
              <Link href="/shop" className="mt-8 inline-block rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white hover:bg-black transition-all">
                Clear Search
              </Link>
            ) : (
              <Link href="/sell" className="mt-8 inline-block rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all">
                Start Selling
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-24">
            {showSections ? (
              Object.entries(productsByCategory).map(([category, products]) => (
                <section key={category}>
                  <div className="flex items-end justify-between mb-8 border-b border-zinc-100 pb-6">
                    <div>
                      <h2 className="text-2xl font-black text-black tracking-tight">{category}</h2>
                      <p className="text-sm text-zinc-400 font-medium">{products.length} {products.length === 1 ? 'Item' : 'Items'} available</p>
                    </div>
                    <Link 
                      href={`/shop?category=${encodeURIComponent(category)}`}
                      className="text-sm font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                    >
                      View All
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                    {products.slice(0, 4).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
