import pool from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";
import BuyNowButton from "@/components/BuyNowButton";
import DeleteProductButton from "@/components/DeleteProductButton";
import { auth } from "@/auth";
import { RowDataPacket } from "mysql2";
import { formatPrice, parsePriceToDecimal } from "@/lib/currency";
import { getProductRating, getProductReviews, getEligibleOrderForReview } from "@/lib/actions";
import ReviewForm from "@/components/ReviewForm";

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

interface UserBalanceRow extends RowDataPacket {
  balance: string;
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

async function getUserBalance(userId: string) {
  try {
    const [rows] = await pool.query<UserBalanceRow[]>("SELECT balance FROM users WHERE id = ?", [userId]);
    return rows[0]?.balance || "0";
  } catch {
    return "0";
  }
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  const session = await auth();

  if (!product) {
    notFound();
  }

  const productRating = await getProductRating(id);
  const productReviews = await getProductReviews(id);
  const eligibleOrderId = session?.user?.id ? await getEligibleOrderForReview(session.user.id, id) : null;
  
  const balance = session?.user?.id ? await getUserBalance(session.user.id) : "0";
  const price = parsePriceToDecimal(product.price).toFixed(2);

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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
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
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {formatPrice(product.price)}
              </p>
              {productRating.count > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={star <= Math.round(productRating.average) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-zinc-700">{productRating.average.toFixed(1)}</span>
                  <span className="text-xs text-zinc-500">({productRating.count} reviews)</span>
                </div>
              )}
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
                <div className="flex flex-col gap-3">
                  <Link 
                    href={`/products/${product.id}/edit`}
                    className="flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700"
                  >
                    Edit Product
                  </Link>
                  <DeleteProductButton productId={product.id} variant="full" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <BuyNowButton productId={product.id} balance={balance} price={price} />
                  <AddToCartButton productId={product.id} />
                  <Link
                    href={`/messages/${product.seller_id}?product=${product.id}`}
                    className="flex w-full items-center justify-center rounded-full border-2 border-zinc-900 bg-transparent px-6 py-4 text-sm font-bold text-zinc-900 transition-all hover:bg-zinc-50 shadow-sm active:scale-[0.98]"
                  >
                    Message Seller
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 pt-12 border-t border-zinc-100">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-zinc-900 mb-4">Customer Reviews</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl font-black text-zinc-900">
                  {productRating.average.toFixed(1)}
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={star <= Math.round(productRating.average) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Based on {productRating.count} reviews</p>
                </div>
              </div>

              {eligibleOrderId && (
                <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
                  <ReviewForm orderId={eligibleOrderId} productId={parseInt(id)} />
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              {productReviews.length === 0 ? (
                <div className="rounded-3xl bg-zinc-50 border border-dashed border-zinc-200 p-12 text-center">
                  <p className="text-zinc-500 font-medium">No reviews yet for this product. Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {productReviews.map((review) => (
                    <div key={review.id} className="pb-8 border-b border-zinc-100 last:border-0">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold uppercase text-xs">
                            {review.reviewer_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900">{review.reviewer_name}</p>
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg key={star} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={star <= review.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                      {review.comment && (
                        <p className="text-zinc-600 leading-relaxed italic">
                          &quot;{review.comment}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
