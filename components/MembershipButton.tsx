'use client';

import { useState } from 'react';
import { updateMembership } from '@/lib/actions';

interface MembershipButtonProps {
  planId: string;
  current: boolean;
  buttonText: string;
}

export default function MembershipButton({ planId, current, buttonText }: MembershipButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleUpdate() {
    if (current) return;
    
    setIsPending(true);
    const formData = new FormData();
    formData.append('account_type', planId);
    
    const result = await updateMembership(formData);
    setIsPending(false);

    if (result?.success) {
      alert(`Membership updated to ${planId.toUpperCase()} successfully!`);
    } else if (result?.error) {
      alert(result.error);
    }
  }

  return (
    <button
      onClick={handleUpdate}
      disabled={current || isPending}
      className={`w-full rounded-full py-4 text-sm font-bold transition-all ${
        current
          ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          : isPending
          ? "bg-zinc-800 text-white opacity-50 cursor-wait"
          : "bg-black text-white hover:bg-zinc-800"
      }`}
    >
      {isPending ? 'Processing...' : buttonText}
    </button>
  );
}
