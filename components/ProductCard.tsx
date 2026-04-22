'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/currency';
import DeleteProductButton from './DeleteProductButton';

export interface Product {
  id: number;
  name: string;
  price: string | number;
  category: string;
  image: string;
  seller_id?: number;
  seller_name?: string;
  seller_tier?: string;
}

interface ProductCardProps {
  product: Product;
  isOwner?: boolean;
  showSeller?: boolean;
  featured?: boolean;
}

export default function ProductCard({ 
  product, 
  isOwner = false, 
  showSeller = true,
  featured = false
}: ProductCardProps) {
  const isVerifiedSeller = product.seller_tier?.toLowerCase() === 'pro';

  return (
    <div className="group relative block h-full">
      <Link href={`/products/${product.id}`} className="cursor-pointer block">
        <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-white shadow-sm border border-zinc-100 sm:rounded-3xl">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
          />
          
          {featured && (
            <div className="absolute top-4 left-4">
              <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                Featured
              </span>
            </div>
          )}

          <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
            <div className="rounded-xl bg-white/90 px-6 py-3 text-sm font-bold text-black backdrop-blur-sm shadow-xl border border-zinc-200/50">
              View Details
            </div>
          </div>
        </div>
      </Link>

      <div className="overflow-hidden px-1">
        <div className="flex justify-between items-start gap-2">
          <Link href={`/products/${product.id}`} className="hover:text-blue-600 transition-colors flex-1 min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.category}</p>
              <h3 className="mt-1 text-sm font-bold text-zinc-900 truncate sm:text-base sm:font-semibold sm:text-black">
                {product.name}
              </h3>
            </div>
          </Link>
          <p className="mt-1 text-sm font-black text-blue-600 whitespace-nowrap">
            {formatPrice(product.price)}
          </p>
        </div>

        {showSeller && product.seller_name && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                Verified
              </span>
            )}
          </div>
        )}
      </div>

      {isOwner && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DeleteProductButton productId={product.id} />
        </div>
      )}
    </div>
  );
}
