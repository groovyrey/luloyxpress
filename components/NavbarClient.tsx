"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

export default function NavbarClient({ session }: { session: Session | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                <Image 
                  src="/logo.png" 
                  alt="LuloyXpress Logo" 
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-2xl font-bold tracking-tighter text-black">
                LULOY<span className="text-blue-600">XPRESS</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600">
              <Link href="/shop" className="hover:text-black transition-colors">Shop All</Link>
              {session && <Link href="/membership" className="hover:text-black transition-colors">Membership</Link>}
              <Link href="/sell" className="hover:text-black transition-colors font-semibold text-blue-600">Sell</Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Search */}
            <div className="hidden sm:block mr-2">
              <form action="/shop" method="GET" className="relative">
                <input 
                  type="text"
                  name="q"
                  placeholder="Search..."
                  className="w-40 lg:w-64 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-1.5 pl-10 text-sm transition-all focus:w-64 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </button>
              </form>
            </div>

            {/* Desktop Cart */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <Link href="/cart" className="p-2 text-zinc-600 hover:text-black transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </Link>
            </div>

            {/* Auth Button Desktop */}
            <div className="hidden md:block">
              {userId ? (
                <div className="flex items-center gap-4 border-l border-zinc-200 pl-4">
                  <Link href={`/profile/${userId}`} className="text-sm font-medium text-zinc-600 hover:text-black transition-colors">
                    Hi, {userName?.split(' ')[0]}
                  </Link>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm font-bold text-black hover:text-zinc-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link href="/login" className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white transition-all hover:bg-zinc-800">
                  Sign In
                </Link>
              )}
            </div>

            {/* Hamburger Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-zinc-600 hover:text-black md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMenuOpen ? (
                  <path d="M18 6 6 18M6 6l12 12"/>
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white p-4 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col gap-4 text-base font-medium text-zinc-600">
            <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="hover:text-black px-2 py-1">Shop All</Link>
            {session && <Link href="/membership" onClick={() => setIsMenuOpen(false)} className="hover:text-black px-2 py-1">Membership</Link>}
            <Link href="/sell" onClick={() => setIsMenuOpen(false)} className="hover:text-black px-2 py-1 font-semibold text-blue-600">Sell</Link>
          </div>
          <div className="pt-4 border-t border-zinc-100">
            {userId ? (
              <div className="space-y-4 px-2">
                <div className="text-sm text-zinc-500 font-medium">Signed in as <span className="text-black">{userName}</span></div>
                <div className="flex flex-col gap-3">
                  <Link href={`/profile/${userId}`} onClick={() => setIsMenuOpen(false)} className="text-sm font-bold text-black">My Profile</Link>
                  <button 
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm font-bold text-red-600 text-left"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                href="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="block w-full rounded-xl bg-black py-3 text-center text-sm font-bold text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
