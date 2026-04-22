import pool from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { RowDataPacket } from "mysql2";
import ProductCard from "@/components/ProductCard";

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

async function getProducts(category?: string, search?: string, page: number = 1, limit: number = 12) {
  try {
    const offset = (page - 1) * limit;
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
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const [rows] = await pool.query<ProductRow[]>(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM products WHERE 1=1";
    const countParams: any[] = [];
    if (category && category !== 'All') {
      countQuery += " AND category = ?";
      countParams.push(category);
    }
    if (search) {
      countQuery += " AND (name LIKE ? OR description LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countRows]: any = await pool.query(countQuery, countParams);
    const total = countRows[0].total;

    return { products: rows, total, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error("Database query error:", error);
    return { products: [], total: 0, totalPages: 0 };
  }
}

function Pagination({ currentPage, totalPages, category, search }: { currentPage: number, totalPages: number, category?: string, search?: string }) {
  if (totalPages <= 1) return null;

  const getPageLink = (p: number) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (search) params.set('q', search);
    params.set('page', p.toString());
    return `/shop?${params.toString()}`;
  };

  return (
    <div className="mt-16 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link href={getPageLink(currentPage - 1)} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold hover:bg-zinc-50 transition-colors">
          Previous
        </Link>
      )}
      <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none pb-2 sm:pb-0">
        {[...Array(totalPages)].map((_, i) => {
          const p = i + 1;
          const isActive = p === currentPage;
          return (
            <Link 
              key={p} 
              href={getPageLink(p)}
              className={`h-10 w-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                isActive ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white text-zinc-500 border border-zinc-200 hover:border-zinc-400'
              }`}
            >
              {p}
            </Link>
          );
        })}
      </div>
      {currentPage < totalPages && (
        <Link href={getPageLink(currentPage + 1)} className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-bold hover:bg-zinc-50 transition-colors">
          Next
        </Link>
      )}
    </div>
  );
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


export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; page?: string }> }) {
  const { category: selectedCategory, q: searchQuery, page: pageStr } = await searchParams;
  const currentPage = parseInt(pageStr || '1');
  const categories = await getUniqueCategories();
  const { products: allProducts, totalPages } = await getProducts(selectedCategory, searchQuery, currentPage);

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
          <div className="text-center py-32 bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200">
            <div className="mx-auto w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{searchQuery ? 'No matches found' : 'Nothing here yet'}</h3>
            <p className="mt-3 text-zinc-500 max-w-sm mx-auto text-lg">
              {searchQuery ? `We couldn't find anything for "${searchQuery}". Maybe try a broader search or browse categories.` : 'This category is currently empty. Be the first to list something or explore other sections!'}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {searchQuery ? (
                <Link href="/shop" className="rounded-full bg-zinc-900 px-10 py-4 text-base font-bold text-white hover:bg-black transition-all shadow-xl shadow-zinc-200">
                  Clear Search
                </Link>
              ) : (
                <>
                  <Link href="/sell" className="rounded-full bg-blue-600 px-10 py-4 text-base font-bold text-white hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                    Start Selling
                  </Link>
                  <Link href="/shop" className="rounded-full bg-white border border-zinc-200 px-10 py-4 text-base font-bold text-zinc-900 hover:bg-zinc-50 transition-all">
                    Browse All
                  </Link>
                </>
              )}
            </div>
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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
                    {products.slice(0, 4).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-12">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          category={selectedCategory} 
          search={searchQuery} 
        />
      </div>
    </div>
  );
}
