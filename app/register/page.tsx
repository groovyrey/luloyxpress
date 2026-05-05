'use client';

import { register, type ActionState } from '@/lib/actions';
import Link from 'next/link';
import Image from 'next/image';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, UserPlus } from 'lucide-react';

const initialState: ActionState = {
  error: undefined,
  success: false,
};

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(register, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      if (state.redirectUrl) {
        window.location.href = state.redirectUrl;
        return;
      }
      toast.success('Registration successful! Please sign in.');
      router.push('/login');
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

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
              Create Account
            </CardTitle>
            <CardDescription className="text-sm">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                Sign in
              </Link>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Juan Dela Cruz"
                  className="h-12 bg-zinc-50/50 focus-visible:bg-white transition-all"
                />
              </div>
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
                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="h-12 bg-zinc-50/50 focus-visible:bg-white transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 transition-colors hover:bg-blue-50">
              <Checkbox id="enableFace2FA" name="enableFace2FA" className="border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
              <Label 
                htmlFor="enableFace2FA" 
                className="text-xs font-medium text-blue-900 cursor-pointer select-none leading-tight"
              >
                Enable Face Biometric 2FA
                <span className="block text-[10px] text-blue-600/70 font-normal">Recommended for secure sign-in</span>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-12 rounded-full font-bold shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

