'use client';

import { loginAction, type ActionState } from '@/lib/actions';
import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useEffect, Suspense } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn } from 'lucide-react';

const initialState: ActionState = {
  error: undefined,
};

function LoginContent() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      toast.success(message);
    }

    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.redirectUrl) {
      window.location.href = state.redirectUrl;
    }
  }, [state, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border-zinc-100 shadow-xl shadow-zinc-200/50">
        <CardHeader className="flex flex-col items-center space-y-4 pb-8">
          <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl shadow-sm border border-zinc-100 bg-white">
              <Image 
                src="/logo.png" 
                alt="LuloyXpress Logo" 
                fill
                sizes="64px"
                className="object-contain p-2"
                priority
              />
            </div>
          </Link>
          <div className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm">
              Sign in to your account or{' '}
              <Link href="/register" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                create one
              </Link>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="h-12 bg-zinc-50/50 focus-visible:bg-white transition-all"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Password
                  </Label>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="h-12 bg-zinc-50/50 focus-visible:bg-white transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-full font-bold shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

