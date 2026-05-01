'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { loginAction } from '@/lib/actions';
import { useActionState } from 'react';

export default function LoginBypassPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const p = searchParams.get('p');
  const formRef = useRef<HTMLFormElement>(null);
  
  const [state, formAction] = useActionState(loginAction, {});

  useEffect(() => {
    if (email && p && formRef.current) {
      formRef.current.requestSubmit();
    }
  }, [email, p]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-zinc-600 font-medium">Finalizing secure sign-in...</p>
        
        <form ref={formRef} action={formAction} className="hidden">
          <input type="hidden" name="email" value={email || ''} />
          <input type="hidden" name="password" value={p || ''} />
          <input type="hidden" name="bypass2FA" value="true" />
        </form>

        {state?.error && (
          <p className="mt-4 text-red-600 font-bold">{state.error}</p>
        )}
      </div>
    </div>
  );
}
