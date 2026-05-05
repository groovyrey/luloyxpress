'use client';

import { useState } from 'react';
import { addFunds } from '@/lib/actions';
import { parsePriceToDecimal } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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
    const result = await addFunds(decimalAmount);
    setIsPending(false);
    
    if (result.success) {
      setAmount('500');
      toast.success('Funds added successfully!');
    } else {
      toast.error('Failed to add funds.');
    }
  }

  return (
    <Card className="bg-zinc-50 border-zinc-100">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          Quick Top-up
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">₱</span>
            <Input 
              type="number"
              value={amount} 
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError(null);
              }}
              min="500"
              max="1000000"
              placeholder="0.00"
              className="pl-7 font-bold"
            />
          </div>
          <Button
            onClick={handleAddFunds}
            disabled={isPending}
            className="font-bold shadow-lg shadow-blue-500/20"
          >
            {isPending ? '...' : 'Add'}
          </Button>
        </div>
        {error && (
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
