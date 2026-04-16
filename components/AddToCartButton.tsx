'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/actions';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ productId }: { productId: number }) {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleAddToCart() {
    setIsPending(true);
    setMessage(null);
    
    const result = await addToCart(productId);
    
    setIsPending(false);
    if (result.error) {
      if (result.error === 'Not authenticated') {
        router.push('/login');
      } else {
        setMessage(result.error);
      }
    } else {
      setMessage('Added to cart!');
      setTimeout(() => setMessage(null), 3000);
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
      {message && (
        <p className={`mt-2 text-center text-sm font-medium ${message.includes('Added') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
