"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buyNow } from "@/lib/actions";

export default function BuyNowButton({ productId, balance, price }: { productId: number, balance: string, price: number }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("wallet");
  const router = useRouter();

  const handleBuyNow = async () => {
    setError(null);
    const result = await buyNow(productId, paymentMethod);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (paymentMethod !== 'wallet') {
      alert(`Order placed successfully via ${paymentMethod === 'card' ? 'Credit Card' : 'GCash/Maya'}!`);
    } else {
      alert("Purchase successful! Thank you for your order.");
    }
    
    startTransition(() => {
      if (result.orderId) {
        router.push(`/receipt/${result.orderId}`);
      } else {
        router.push("/shop");
      }
    });
  };

  const isBalanceLow = parseFloat(balance) < price;

  return (
    <div className="w-full space-y-4">
      {!showPayment ? (
        <button
          onClick={() => setShowPayment(true)}
          className="flex w-full items-center justify-center rounded-full bg-black px-6 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Buy Now
        </button>
      ) : (
        <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wider">Checkout</h3>
            <button onClick={() => setShowPayment(false)} className="text-zinc-400 hover:text-black">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white hover:border-zinc-200'}`}>
              <input type="radio" name="buyNowPayment" value="wallet" checked={paymentMethod === 'wallet'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600" />
              <div className="flex-grow text-left">
                <p className="text-xs font-bold text-zinc-900">Wallet Balance</p>
                <p className="text-[10px] text-zinc-500 font-medium">₱{parseFloat(balance).toLocaleString()}</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'gcash' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white hover:border-zinc-200'}`}>
              <input type="radio" name="buyNowPayment" value="gcash" checked={paymentMethod === 'gcash'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600" />
              <div className="flex-grow text-left">
                <p className="text-xs font-bold text-zinc-900">GCash / Maya</p>
                <p className="text-[10px] text-zinc-500 font-medium">External wallet</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-white bg-white hover:border-zinc-200'}`}>
              <input type="radio" name="buyNowPayment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600" />
              <div className="flex-grow text-left">
                <p className="text-xs font-bold text-zinc-900">Credit / Debit Card</p>
                <p className="text-[10px] text-zinc-500 font-medium">Visa / Mastercard</p>
              </div>
            </label>
          </div>

          {paymentMethod !== 'wallet' && (
            <div className="mb-4 animate-in fade-in duration-200">
               <input 
                  type="text" 
                  placeholder={paymentMethod === 'gcash' ? "Mobile Number" : "Card Number"} 
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
            </div>
          )}

          <button
            onClick={handleBuyNow}
            disabled={isPending || isBalanceLow}
            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isPending ? "Processing..." : isBalanceLow ? "Insufficient Balance" : `Pay ₱${price.toLocaleString()}`}
          </button>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-center text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
          {error}
        </p>
      )}
    </div>
  );
}
