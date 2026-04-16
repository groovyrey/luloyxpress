import pool from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import DeleteProductButton from "@/components/DeleteProductButton";
import { auth } from "@/auth";
import { RowDataPacket } from "mysql2";

interface ProductRow extends RowDataPacket {
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  description: string;
  tags?: string;
  seller_id: number;
  seller_name?: string;
  seller_email?: string;
  seller_tier?: string;
}

async function getProduct(id: string) {
  try {
    const [rows] = await pool.query<ProductRow[]>(
      `SELECT p.*, u.name as seller_name, u.email as seller_email, u.account_type as seller_tier
       FROM products p 
       LEFT JOIN users u ON p.seller_id = u.id 
       WHERE p.id = ?`,
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  const session = await auth();

  if (!product) {
    notFound();
  }

  const isSeller = session?.user?.id === product.seller_id?.toString();
  const isVerifiedSeller = product.seller_tier?.toLowerCase() === 'pro';

  return (
    <div className="min-h-screen bg-white font-sans py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-8 text-sm font-medium text-zinc-500">
          <Link href="/shop" className="hover:text-black transition-colors">Shop All</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900 truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Product Image */}
          <div className="aspect-square w-full overflow-hidden rounded-3xl bg-white relative">
            <Image 
              src={product.image} 
              alt={product.name} 
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">
                {product.category}
              </span>
              <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-blue-600">
                {product.price}
              </p>
            </div>

            <div className="mb-8 pt-8 border-t border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Description</h3>
              {product.description ? (
                <p className="text-lg leading-relaxed text-zinc-600">
                  {product.description}
                </p>
              ) : (
                <div className="rounded-xl bg-zinc-50 border border-dashed border-zinc-200 p-6 text-center">
                  <p className="text-zinc-400 italic">No description provided for this listing.</p>
                </div>
              )}

              {product.tags && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.split(',').map((tag) => (
                    <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600 border border-blue-100">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="mb-10 p-6 rounded-2xl bg-zinc-50 border border-zinc-100">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Seller Information</h3>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold border border-zinc-200">
                  {product.seller_name?.charAt(0) || "S"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {product.seller_id ? (
                      <Link href={`/profile/${product.seller_id}`} className="font-bold text-zinc-900 hover:text-blue-600 transition-colors">
                        {product.seller_name || "LuloyXpress Official"}
                      </Link>
                    ) : (
                      <p className="font-bold text-zinc-900">{product.seller_name || "LuloyXpress Official"}</p>
                    )}
                    {isVerifiedSeller && (
                      <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase border border-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        Verified Seller
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500">{product.seller_email || "contact@luloyxpress.com"}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              {isSeller ? (
                <DeleteProductButton productId={product.id} variant="full" />
              ) : (
                <>
                  <AddToCartButton productId={product.id} />
                  <button className="w-full rounded-full border border-zinc-200 py-4 text-base font-bold text-zinc-900 transition-all hover:bg-zinc-50 active:scale-[0.98]">
                    Message Seller
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
