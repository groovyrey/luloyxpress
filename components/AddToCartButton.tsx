'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/actions';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

export default function AddToCartButton({ productId }: { productId: number }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleAddToCart() {
    setIsPending(true);
    
    const result = await addToCart(productId);
    
    setIsPending(false);
    if (result.error) {
      if (result.error === 'Not authenticated') {
        router.push('/login');
      } else {
        toast.error(result.error);
      }
    } else {
      toast.success('Added to cart!');
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleAddToCart}
        disabled={isPending}
        className="w-full rounded-full bg-black py-4 text-base font-bold text-white transition-all hover:bg-zinc-800 shadow-lg active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}
