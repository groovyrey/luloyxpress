"use client";

import { useState, useActionState, useEffect } from "react";
import { createReview, type ActionState } from "@/lib/actions";
import { toast } from "sonner";

export default function ReviewForm({ orderId, productId }: { orderId: number, productId: number }) {
  const initialState: ActionState = { error: undefined, success: false };
  const [state, formAction, isPending] = useActionState(createReview, initialState);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (state.success) {
      toast.success("Review submitted! Thank you for your feedback.");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  if (state.success) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl text-center">
        <p className="text-emerald-700 font-bold">Thank you for reviewing your purchase!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200 p-8 rounded-3xl shadow-sm">
      <h3 className="text-xl font-bold text-zinc-900 mb-2 text-center">Rate your experience</h3>
      <p className="text-sm text-zinc-500 mb-6 text-center">Your feedback helps the community grow.</p>
      
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="order_id" value={orderId} />
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="rating" value={rating} />
        
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform active:scale-90"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="40" 
                height="40" 
                viewBox="0 0 24 24" 
                fill={(hoverRating || rating) >= star ? "#EAB308" : "none"} 
                stroke={(hoverRating || rating) >= star ? "#EAB308" : "#D4D4D8"} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-colors"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
            {rating === 1 ? "Disappointing" : 
             rating === 2 ? "Below Average" : 
             rating === 3 ? "As Expected" : 
             rating === 4 ? "Great Experience" : "Exceptional"}
          </p>
        </div>

        <div>
          <label htmlFor="comment" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
            Your Comment (Optional)
          </label>
          <textarea
            id="comment"
            name="comment"
            rows={3}
            placeholder="Tell us more about the product or seller..."
            className="block w-full rounded-xl border border-zinc-300 px-4 py-3 text-zinc-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-blue-600 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
