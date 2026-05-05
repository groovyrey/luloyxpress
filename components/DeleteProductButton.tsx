'use client';

import { useState } from 'react';
import { deleteProduct } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteProductButtonProps {
  productId: number;
  variant?: 'icon' | 'full';
}

export default function DeleteProductButton({ productId, variant = 'icon' }: DeleteProductButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteProduct(productId);
    setIsDeleting(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Product removed!');
      if (variant === 'full') {
        router.push('/shop');
      } else {
        router.refresh();
      }
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            variant={variant === 'full' ? 'outline' : 'ghost'}
            size={variant === 'full' ? 'default' : 'icon'}
            disabled={isDeleting}
            className={
              variant === 'full'
                ? 'w-full rounded-full py-6 text-base font-bold text-red-600 border-red-100 bg-red-50 hover:bg-red-100 hover:text-red-700 hover:border-red-200 transition-all active:scale-[0.98]'
                : 'absolute top-2 right-2 h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all'
            }
            title={variant === 'icon' ? "Delete Product" : undefined}
            onClick={variant === 'icon' ? (e) => e.stopPropagation() : undefined}
          />
        }
      >
        {isDeleting ? (
          <Loader2 className={variant === 'full' ? 'h-5 w-5 animate-spin' : 'h-4 w-4 animate-spin'} />
        ) : (
          <>
            <Trash2 className={variant === 'full' ? 'h-5 w-5 mr-2' : 'h-4 w-4'} />
            {variant === 'full' && 'Remove Listing'}
          </>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your product
            listing from the marketplace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
