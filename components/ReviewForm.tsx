"use client";

import { useState, useActionState, useEffect } from "react";
import { createReview, type ActionState } from "@/lib/actions";
import { toast } from "sonner";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <Card className="bg-emerald-50/50 border-emerald-100 p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center gap-2">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="text-emerald-700 font-bold text-lg">Thank you for reviewing your purchase!</p>
          <p className="text-emerald-600/70 text-sm">Your feedback helps the community grow.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200 shadow-sm overflow-hidden">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl font-bold text-zinc-900">Rate your experience</CardTitle>
        <CardDescription>Your feedback helps the community grow.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-4">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="rating" value={rating} />
          
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform active:scale-90 outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 rounded-lg"
              >
                <Star 
                  className={cn(
                    "h-10 w-10 transition-all duration-200",
                    (hoverRating || rating) >= star 
                      ? "fill-yellow-400 text-yellow-400 scale-110" 
                      : "text-zinc-200 fill-transparent"
                  )}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>
          
          <div className="text-center h-4">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-1">
              {rating === 1 ? "Disappointing" : 
               rating === 2 ? "Below Average" : 
               rating === 3 ? "As Expected" : 
               rating === 4 ? "Great Experience" : "Exceptional"}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="comment" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Your Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              name="comment"
              rows={3}
              placeholder="Tell us more about the product or seller..."
              className="resize-none focus-visible:ring-blue-500/20"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-12 rounded-full font-bold shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

