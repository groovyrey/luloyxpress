"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useLiveUpdates } from "./LiveUpdatesProvider";
import { formatPrice } from "@/lib/currency";
import { 
  Search, 
  ShoppingBag, 
  MessageSquare, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Gem, 
  PlusCircle, 
  LayoutDashboard,
  Store,
  Sparkles,
  Home,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarContentProps {
  userId?: string;
  displayCartCount: number;
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  pathname: string;
  setIsSidebarOpen: (open: boolean) => void;
}

const SidebarContent = ({ 
  userId, 
  displayCartCount,
  unreadMessages, 
  setUnreadMessages,
  pathname,
  setIsSidebarOpen,
}: SidebarContentProps) => {
  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop All", href: "/shop", icon: Store },
    { name: "New Arrivals", href: "/new-arrivals", icon: Sparkles },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, authRequired: true },
    { name: "Membership", href: "/membership", icon: Gem, authRequired: true },
    { name: "Messages", href: "/messages", icon: MessageSquare, authRequired: true, badge: unreadMessages > 0 ? "dot" : null },
    { name: "Cart", href: "/cart", icon: ShoppingBag, badge: displayCartCount > 0 ? (displayCartCount > 99 ? '99+' : displayCartCount) : null },
    { name: "Docs", href: "/docs", icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-y-auto">
      <div className="p-6">
        <div className="space-y-1">
          <h3 className="px-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Navigation
          </h3>
          <nav className="grid gap-1">
            {navLinks.map((link) => {
              if (link.authRequired && !userId) return null;
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              
              return (
                <Link 
                  key={link.name}
                  href={link.href} 
                  className={cn(
                    "group flex items-center justify-between p-3 rounded-xl transition-all active:scale-[0.98]",
                    isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "hover:bg-zinc-50 text-zinc-700"
                  )}
                  onClick={() => {
                    if (link.name === 'Messages') setUnreadMessages(0);
                    setIsSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? "bg-white/20 text-white" : "bg-zinc-50 text-zinc-500 group-hover:bg-zinc-100"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-bold">{link.name}</span>
                  </div>
                  {link.badge && (
                    link.badge === "dot" ? (
                      <span className="h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
                    ) : (
                      <Badge className={cn(
                        "h-5 w-fit min-w-[20px] flex items-center justify-center p-1 text-[10px] font-bold border-none",
                        isActive ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                      )}>
                        {link.badge}
                      </Badge>
                    )
                  )}
                </Link>
              );
            })}

            <Link 
              href="/sell" 
              className="group flex items-center justify-between p-3 rounded-xl bg-blue-600/5 hover:bg-blue-600/10 transition-all active:scale-[0.98] mt-4 border border-blue-600/10"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <span className="font-bold text-blue-600">Sell a Product</span>
              </div>
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};


export default function NavbarClient({ 
  session
}: { 
  session: Session | null;
}) {
  const pathname = usePathname();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { 
    cartCount, 
    balance, 
    unreadMessages, 
    setUnreadMessages,
    isSidebarOpen,
    setIsSidebarOpen
  } = useLiveUpdates();
  
  const displayCartCount = cartCount;
  const displayBalance = balance;
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  // Auto-close menu and search on navigation
  useEffect(() => {
    setIsSidebarOpen(false);
    setIsMobileSearchOpen(false);
  }, [pathname, setIsSidebarOpen]);

  return (
    <>
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md px-4 h-16 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-zinc-100 rounded-xl"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-blue-600 p-1.5 transition-transform group-hover:scale-110">
              <Image src="/logo.png" alt="Logo" fill className="object-contain filter invert brightness-0" />
            </div>
            <span className="font-bold text-xl tracking-tighter">
              LULOY<span className="text-blue-600">XPRESS</span>
            </span>
          </Link>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form action="/shop" method="GET" className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              type="text"
              name="q"
              placeholder="Search products..."
              className="w-full bg-zinc-50 border-zinc-200 pl-10 h-10 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            />
          </form>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile Search Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden hover:bg-zinc-100 rounded-xl"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            {isMobileSearchOpen ? <X className="h-5 w-5 text-zinc-600" /> : <Search className="h-5 w-5 text-zinc-600" />}
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            render={<Link href="/sell" />}
            nativeButton={false}
            className="hidden sm:flex hover:bg-zinc-100 rounded-xl text-zinc-600"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            render={<Link href="/cart" />}
            nativeButton={false}
            className="hover:bg-zinc-100 rounded-xl text-zinc-600 relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {displayCartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-blue-600 text-white border-2 border-white">
                {displayCartCount > 99 ? '99+' : displayCartCount}
              </Badge>
            )}
          </Button>

          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="p-1 hover:bg-zinc-100 rounded-xl gap-2 h-10 group" />}>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm group-hover:shadow-blue-500/20 transition-all">
                {userName?.[0]}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                <span className="text-xs font-bold text-black truncate max-w-[80px]">{userName}</span>
                <span className="text-[10px] font-black text-blue-600">{formatPrice(displayBalance)}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border-zinc-100">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">My Account</p>
                    <p className="text-sm font-bold text-blue-600">{formatPrice(displayBalance)}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="mx-2 bg-zinc-100" />
              <DropdownMenuItem className="p-0">
                <Link href={`/profile/${userId}`} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors w-full">
                  <User className="h-4 w-4 text-zinc-500" />
                  <span className="font-bold text-sm">Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-2 bg-zinc-100" />
              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer text-red-600 hover:bg-red-50 transition-colors focus:bg-red-50 focus:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="font-bold text-sm">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-sm transition-all h-9 px-4">
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Search Bar Expansion */}
        {isMobileSearchOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-zinc-200 p-4 md:hidden animate-in slide-in-from-top duration-200 shadow-lg">
            <form action="/shop" method="GET" className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                autoFocus
                type="text"
                name="q"
                placeholder="Search products..."
                className="w-full bg-zinc-50 border-zinc-200 pl-10 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20"
              />
            </form>
          </div>
        )}
      </header>

      {/* Unified Navigation Drawer */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[300px] border-r-0 shadow-2xl">
          <div className="flex items-center gap-2 p-6 border-b border-zinc-100">
            <div className="h-8 w-8 overflow-hidden rounded-xl bg-blue-600 p-1.5">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain filter invert brightness-0" />
            </div>
            <span className="font-bold text-xl tracking-tighter">
              LULOY<span className="text-blue-600">XPRESS</span>
            </span>
          </div>
          <SidebarContent 
            userId={userId}
            displayCartCount={displayCartCount}
            unreadMessages={unreadMessages}
            setUnreadMessages={setUnreadMessages}
            pathname={pathname}
            setIsSidebarOpen={setIsSidebarOpen}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
