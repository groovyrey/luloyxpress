"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/currency";
import { 
  Wallet, 
  ShoppingBag, 
  Store, 
  TrendingUp, 
  Clock, 
  PlusCircle, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardClientProps {
  user: {
    name: string;
    balance: string;
    account_type: string;
  };
  stats: {
    totalRevenue: string;
    totalSales: number;
    activeListings: number;
    totalPurchases: number;
  };
  recentTransactions: any[];
  recentSales: any[];
}

export default function DashboardClient({ 
  user, 
  stats, 
  recentTransactions, 
  recentSales 
}: DashboardClientProps) {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Dashboard</h1>
          <p className="text-zinc-500 font-medium">Welcome back, {user.name.split(' ')[0]}!</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" render={<Link href="/sell" />} nativeButton={false} className="rounded-xl border-zinc-200">
            <PlusCircle className="mr-2 h-4 w-4" /> List Product
          </Button>
          <Button render={<Link href="/shop" />} nativeButton={false} className="rounded-xl bg-blue-600 hover:bg-blue-700">
            <ShoppingBag className="mr-2 h-4 w-4" /> Shop Now
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-100 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Wallet className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Wallet Balance</p>
            <p className="text-2xl font-black text-zinc-900">{formatPrice(user.balance)}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Revenue</p>
            <p className="text-2xl font-black text-zinc-900">{formatPrice(stats.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                <Store className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Active Listings</p>
            <p className="text-2xl font-black text-zinc-900">{stats.activeListings}</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 shadow-sm overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Purchases</p>
            <p className="text-2xl font-black text-zinc-900">{stats.totalPurchases}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-zinc-900">Recent Transactions</h2>
            <Link href={`/profile/${(user as any).id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View History <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-50 overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-medium">No recent activity</p>
              </div>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${
                      tx.type === 'deposit' || tx.type === 'sale' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'sale' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 leading-none mb-1">{tx.description}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                        {new Date(tx.created_at).toLocaleDateString()} • {tx.type}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${
                    tx.type === 'deposit' || tx.type === 'sale' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'sale' ? '+' : '-'} {formatPrice(tx.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Sales */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-zinc-900">Recent Sales</h2>
            <Link href={`/profile/${(user as any).id}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Seller Hub <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm divide-y divide-zinc-50 overflow-hidden">
            {recentSales.length === 0 ? (
              <div className="p-12 text-center">
                <Store className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-medium">No sales yet</p>
              </div>
            ) : (
              recentSales.map((sale, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                      #{sale.order_id}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 leading-none mb-1 line-clamp-1">{sale.product_name}</p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                        Qty: {sale.quantity} • {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-zinc-900">
                    {formatPrice(sale.price)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
