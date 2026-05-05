'use client';

import { useState } from 'react';
import { addToCart } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

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
    <Button
      onClick={handleAddToCart}
      disabled={isPending}
      className="w-full rounded-full py-6 text-base font-bold shadow-lg transition-all active:scale-[0.98]"
    >
      <ShoppingCart className="mr-2 h-5 w-5" />
      {isPending ? 'Adding...' : 'Add to Cart'}
    </Button>
  );
}
