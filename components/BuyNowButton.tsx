"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buyNow } from "@/lib/actions";
import { parsePriceToDecimal, formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Wallet, Smartphone, CreditCard, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BuyNowButton({ productId, balance, price }: { productId: number, balance: string, price: string }) {
  const [isPending, startTransition] = useTransition();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("wallet");
  const router = useRouter();

  const handleBuyNow = async () => {
    const result = await buyNow(productId, paymentMethod);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (paymentMethod !== 'wallet') {
      toast.success(`Order placed successfully via ${paymentMethod === 'card' ? 'Credit Card' : 'GCash/Maya'}!`);
    } else {
      toast.success("Purchase successful! Thank you for your order.");
    }
    
    startTransition(() => {
      if (result.orderId) {
        router.push(`/receipt/${result.orderId}`);
      } else {
        router.push("/shop");
      }
    });
  };

  const isBalanceLow = paymentMethod === 'wallet' && parsePriceToDecimal(balance) < parsePriceToDecimal(price);

  return (
    <div className="w-full space-y-4">
      {!showPayment ? (
        <Button
          onClick={() => setShowPayment(true)}
          className="w-full rounded-full py-6 text-base font-bold shadow-lg transition-all active:scale-[0.98]"
        >
          Buy Now
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      ) : (
        <Card className="bg-zinc-50 border-zinc-200 animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Checkout</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowPayment(false)} className="h-8 w-8 text-zinc-400">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="gap-3">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="wallet"
                  className={`flex items-center flex-1 gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white hover:border-zinc-200'}`}
                >
                  <RadioGroupItem value="wallet" id="wallet" className="sr-only" />
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-zinc-900">Wallet Balance</p>
                    <p className="text-[10px] text-zinc-500 font-medium">{formatPrice(balance)}</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="gcash"
                  className={`flex items-center flex-1 gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'gcash' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white hover:border-zinc-200'}`}
                >
                  <RadioGroupItem value="gcash" id="gcash" className="sr-only" />
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Smartphone className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-zinc-900">GCash / Maya</p>
                    <p className="text-[10px] text-zinc-500 font-medium">External wallet</p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="card"
                  className={`flex items-center flex-1 gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white hover:border-zinc-200'}`}
                >
                  <RadioGroupItem value="card" id="card" className="sr-only" />
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-zinc-900">Credit / Debit Card</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Visa / Mastercard</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {paymentMethod !== 'wallet' && (
              <div className="animate-in fade-in duration-200">
                 <Input 
                    type="text" 
                    placeholder={paymentMethod === 'gcash' ? "Mobile Number" : "Card Number"} 
                    className="bg-white"
                  />
              </div>
            )}

            <Button
              onClick={handleBuyNow}
              disabled={isPending || isBalanceLow}
              className="w-full py-6 font-bold shadow-lg"
            >
              {isPending ? "Processing..." : isBalanceLow ? "Insufficient Balance" : `Pay ${formatPrice(price)}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
