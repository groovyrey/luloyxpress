'use client';

import { useState } from 'react';
import { addFunds } from '@/lib/actions';

export default function AddFundsButton() {
  const [isPending, setIsPending] = useState(false);
  const [amount, setAmount] = useState('1000');

  async function handleAddFunds() {
    setIsPending(true);
    const result = await addFunds(parseFloat(amount));
    setIsPending(false);
    if (result.success) {
      alert('Funds added successfully!');
    } else {
      alert('Failed to add funds.');
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Quick Top-up</h4>
      <div className="flex gap-2">
        <select 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          className="flex-grow rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="500">₱500</option>
          <option value="1000">₱1,000</option>
          <option value="5000">₱5,000</option>
          <option value="10000">₱10,000</option>
        </select>
        <button
          onClick={handleAddFunds}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'Add'}
        </button>
      </div>
    </div>
  );
}
