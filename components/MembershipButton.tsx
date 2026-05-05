'use client';

import { useState } from 'react';
import { updateMembership } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, Loader2 } from 'lucide-react';

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
      toast.success(`Membership updated to ${planId.toUpperCase()} successfully!`, {
        icon: <Check className="h-4 w-4" />,
      });
    } else if (result?.error) {
      toast.error(result.error);
    }
  }

  return (
    <Button
      onClick={handleUpdate}
      disabled={current || isPending}
      variant={current ? "outline" : "default"}
      className={`w-full h-12 rounded-full font-bold transition-all ${
        current ? "bg-zinc-100 text-zinc-400 border-zinc-200" : ""
      }`}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        buttonText
      )}
    </Button>
  );
}

