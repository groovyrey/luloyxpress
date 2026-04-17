"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { removeFromCart, checkout } from "@/lib/actions";
import { useRouter } from "next/navigation";

interface CartItem {
  cart_item_id: number;
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  quantity: number;
}

interface CartClientProps {
  cartItems: CartItem[];
  balance: string;
}

export default function CartClient({ cartItems, balance }: CartClientProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(cartItems.map(item => item.cart_item_id));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<string>("wallet");
  const [fakePaymentInfo, setFakePaymentInfo] = useState({ card: "", expiry: "", gcash: "" });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map(item => item.cart_item_id));
    }
  };

  const selectedItems = cartItems.filter(item => selectedIds.includes(item.cart_item_id));
  
  const subtotal = selectedItems.reduce((acc, item) => {
    const price = parseFloat(item.price.replace(/[^\d.]/g, ''));
    return acc + (price * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (selectedIds.length === 0) return;

    setError(null);

    // Call the real checkout action with the payment method
    const result = await checkout(selectedIds, paymentMethod);

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
      // Redirect to the new receipt
      if (result.orderId) {
        router.push(`/receipt/${result.orderId}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleRemove = async (id: number) => {
    await removeFromCart(id);
    setSelectedIds(prev => prev.filter(i => i !== id));
    router.refresh();
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-zinc-200">
        <div className="mb-4 flex justify-center text-zinc-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Your cart is empty</h2>
        <p className="text-zinc-500 mb-6">Looks like you haven&apos;t added anything to your cart yet.</p>
        <Link href="/shop" className="inline-block rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-zinc-200 mb-2">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={selectedIds.length === cartItems.length && cartItems.length > 0}
              onChange={toggleSelectAll}
              className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-zinc-700">Select All ({cartItems.length})</span>
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Product Details</span>
        </div>

        {cartItems.map((item) => (
          <div key={item.cart_item_id} className="bg-white rounded-2xl p-4 border border-zinc-200 flex gap-4 items-center">
            <div className="flex-shrink-0">
              <input 
                type="checkbox" 
                checked={selectedIds.includes(item.cart_item_id)}
                onChange={() => toggleSelect(item.cart_item_id)}
                className="h-5 w-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            <div className="h-24 w-24 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 relative">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
            </div>
            <div className="flex-grow flex flex-col justify-between h-24">
              <div>
                <h3 className="font-bold text-zinc-900 truncate">{item.name}</h3>
                <p className="text-xs text-zinc-500">{item.category}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-blue-600">{item.price} <span className="text-zinc-400 text-xs font-medium">x {item.quantity}</span></p>
                <button 
                  onClick={() => handleRemove(item.cart_item_id)}
                  className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm sticky top-24">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Order Summary</h2>
          <div className="space-y-3 pb-4 border-b border-zinc-100">
            <div className="flex justify-between text-zinc-600">
              <span>Selected Items</span>
              <span className="font-bold text-zinc-900">{selectedIds.length}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal</span>
              <span>₱{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-zinc-600">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
          </div>
          <div className="pt-4 mb-6">
            <div className="flex justify-between items-end">
              <span className="text-zinc-900 font-bold">Total</span>
              <span className="text-2xl font-black text-zinc-900">₱{subtotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Payment Method</h3>
            
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}>
                <input type="radio" name="payment" value="wallet" checked={paymentMethod === 'wallet'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600" />
                <div className="flex-grow">
                  <p className="text-sm font-bold text-zinc-900">LuloyXpress Wallet</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Balance: ₱{parseFloat(balance).toLocaleString()}</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'gcash' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}>
                <input type="radio" name="payment" value="gcash" checked={paymentMethod === 'gcash'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600" />
                <div className="flex-grow">
                  <p className="text-sm font-bold text-zinc-900">GCash / Maya</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Pay via mobile wallet</p>
                </div>
              </label>

              {paymentMethod === 'gcash' && (
                <div className="p-3 bg-zinc-50 rounded-xl space-y-2 animate-in slide-in-from-top-2">
                  <input 
                    type="text" 
                    placeholder="Mobile Number (09XX...)" 
                    className="w-full text-sm p-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={fakePaymentInfo.gcash}
                    onChange={(e) => setFakePaymentInfo({...fakePaymentInfo, gcash: e.target.value})}
                  />
                </div>
              )}

              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}>
                <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="h-4 w-4 text-blue-600" />
                <div className="flex-grow">
                  <p className="text-sm font-bold text-zinc-900">Credit / Debit Card</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Visa, Mastercard, JCB</p>
                </div>
              </label>

              {paymentMethod === 'card' && (
                <div className="p-3 bg-zinc-50 rounded-xl space-y-2 animate-in slide-in-from-top-2">
                  <input 
                    type="text" 
                    placeholder="Card Number" 
                    className="w-full text-sm p-2 rounded-lg border border-zinc-200"
                    value={fakePaymentInfo.card}
                    onChange={(e) => setFakePaymentInfo({...fakePaymentInfo, card: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      className="w-1/2 text-sm p-2 rounded-lg border border-zinc-200"
                      value={fakePaymentInfo.expiry}
                      onChange={(e) => setFakePaymentInfo({...fakePaymentInfo, expiry: e.target.value})}
                    />
                    <input type="text" placeholder="CVV" className="w-1/2 text-sm p-2 rounded-lg border border-zinc-200" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={isPending || selectedIds.length === 0 || parseFloat(balance) < subtotal}
            className="w-full rounded-full bg-black py-4 text-base font-bold text-white transition-all hover:bg-zinc-800 shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Processing...' : 
             selectedIds.length === 0 ? 'Select Items to Buy' :
             parseFloat(balance) < subtotal ? 'Insufficient Balance' : 'Complete Purchase'}
          </button>
          
          {error && (
            <p className="mt-4 text-center text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
