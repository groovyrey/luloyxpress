'use client';

import { useState } from 'react';
import { addFunds } from '@/lib/actions';
import { parsePriceToDecimal } from '@/lib/currency';

export default function AddFundsButton() {
  const [isPending, setIsPending] = useState(false);
  const [amount, setAmount] = useState('500');
  const [error, setError] = useState<string | null>(null);

  async function handleAddFunds() {
    const decimalAmount = parsePriceToDecimal(amount);
    
    if (isNaN(decimalAmount) || decimalAmount < 500) {
      setError('Minimum top-up is ₱500');
      return;
    }

    if (decimalAmount > 1000000) {
      setError('Maximum top-up is ₱1,000,000');
      return;
    }

    setError(null);
    setIsPending(true);
    // Send numeric value but addFunds logic inside handles it as Decimal
    const result = await addFunds(decimalAmount);
    setIsPending(false);
    
    if (result.success) {
      setAmount('500');
      alert('Funds added successfully!');
    } else {
      alert('Failed to add funds.');
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Quick Top-up</h4>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₱</span>
            <input 
              type="number"
              value={amount} 
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              min="500"
              max="1000000"
              placeholder="0.00"
              className="w-full rounded-lg border border-zinc-200 bg-white pl-7 pr-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            onClick={handleAddFunds}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            {isPending ? '...' : 'Add'}
          </button>
        </div>
        {error && (
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{error}</p>
        )}
      </div>
    </div>
  );
}
