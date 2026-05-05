"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { removeFromCart, checkout } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { formatPrice, parsePriceToDecimal, calculateTotal } from "@/lib/currency";
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Wallet, 
  Smartphone, 
  CreditCard,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CartItem {
  cart_item_id: number;
  id: number;
  name: string;
  price: string;
  category: string;
  image: string;
  quantity: number;
}

interface CartClientProps {
  cartItems: CartItem[];
  balance: string;
}

export default function CartClient({ cartItems, balance }: CartClientProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(cartItems.map(item => item.cart_item_id));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<string>("wallet");
  const [fakePaymentInfo, setFakePaymentInfo] = useState({ card: "", expiry: "", gcash: "" });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map(item => item.cart_item_id));
    }
  };

  const selectedItems = cartItems.filter(item => selectedIds.includes(item.cart_item_id));
  
  const subtotal = calculateTotal(selectedItems.map(item => {
    const unitPrice = parsePriceToDecimal(item.price);
    return unitPrice * item.quantity;
  }));

  const handleCheckout = async () => {
    if (selectedIds.length === 0) return;

    setError(null);

    const result = await checkout(selectedIds, paymentMethod);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      return;
    }

    if (paymentMethod !== 'wallet') {
      toast.success(`Order placed successfully via ${paymentMethod === 'card' ? 'Credit Card' : 'GCash/Maya'}!`);
    } else {
      toast.success("Purchase successful! Thank you for your order.");
    }

    startTransition(() => {
      if (result.orderId) {
        router.push(`/receipt/${result.orderId}`);
      } else {
        router.refresh();
      }
    });
  };

  const handleRemove = async (id: number) => {
    const result = await removeFromCart(id);
    if (result.success) {
      setSelectedIds(prev => prev.filter(i => i !== id));
      toast.success("Removed from cart");
      router.refresh();
    } else {
      toast.error("Failed to remove item");
    }
  };

  const isBalanceInsufficient = paymentMethod === 'wallet' && parsePriceToDecimal(balance) < parsePriceToDecimal(subtotal);

  if (cartItems.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-6 rounded-full bg-zinc-50 p-6">
            <ShoppingBag className="h-12 w-12 text-zinc-300" />
          </div>
          <CardTitle className="text-2xl font-bold mb-2">Your cart is empty</CardTitle>
          <p className="text-muted-foreground mb-8 max-w-xs">Looks like you haven&apos;t added anything to your cart yet.</p>
          <Button render={<Link href="/shop" />} size="lg" className="rounded-full px-8">
            Start Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <Card className="shadow-none">
          <CardHeader className="py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox 
                id="select-all"
                checked={selectedIds.length === cartItems.length && cartItems.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <Label htmlFor="select-all" className="text-sm font-bold cursor-pointer">
                Select All ({cartItems.length})
              </Label>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Product Details</span>
          </CardHeader>
        </Card>

        {cartItems.map((item) => (
          <Card key={item.cart_item_id} className="shadow-none transition-all hover:shadow-sm">
            <CardContent className="p-4 flex gap-4 items-center">
              <Checkbox 
                checked={selectedIds.includes(item.cart_item_id)}
                onCheckedChange={() => toggleSelect(item.cart_item_id)}
              />
              <div className="h-24 w-24 rounded-xl overflow-hidden bg-zinc-50 flex-shrink-0 relative border border-zinc-100">
                <Image src={item.image} alt={item.name} fill className="object-contain p-2" sizes="96px" />
              </div>
              <div className="flex-grow flex flex-col justify-between min-h-[96px]">
                <div>
                  <h3 className="font-bold text-zinc-900 line-clamp-2 leading-snug">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-black text-blue-600">{formatPrice(item.price)}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">Qty: {item.quantity}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemove(item.cart_item_id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <Card className="sticky top-24 shadow-lg border-zinc-200">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selected Items</span>
                <span className="font-bold">{selectedIds.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Free</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-end">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-black text-blue-600">{formatPrice(subtotal)}</span>
            </div>

            <div className="pt-4 space-y-4">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Payment Method</h3>
              
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="gap-2">
                <Label
                  htmlFor="wallet"
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                >
                  <RadioGroupItem value="wallet" id="wallet" className="sr-only" />
                  <Wallet className={`h-4 w-4 ${paymentMethod === 'wallet' ? 'text-blue-600' : 'text-zinc-400'}`} />
                  <div className="flex-grow">
                    <p className="text-sm font-bold">LuloyXpress Wallet</p>
                    <p className="text-[10px] text-zinc-500 font-medium">{formatPrice(balance)}</p>
                  </div>
                </Label>

                <Label
                  htmlFor="gcash"
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'gcash' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                >
                  <RadioGroupItem value="gcash" id="gcash" className="sr-only" />
                  <Smartphone className={`h-4 w-4 ${paymentMethod === 'gcash' ? 'text-blue-600' : 'text-zinc-400'}`} />
                  <div className="flex-grow">
                    <p className="text-sm font-bold">GCash / Maya</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Pay via mobile wallet</p>
                  </div>
                </Label>

                {paymentMethod === 'gcash' && (
                  <div className="px-1 animate-in slide-in-from-top-2">
                    <Input 
                      placeholder="Mobile Number (09XX...)" 
                      value={fakePaymentInfo.gcash}
                      onChange={(e) => setFakePaymentInfo({...fakePaymentInfo, gcash: e.target.value})}
                      className="bg-zinc-50"
                    />
                  </div>
                )}

                <Label
                  htmlFor="card"
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-zinc-100 hover:border-zinc-200'}`}
                >
                  <RadioGroupItem value="card" id="card" className="sr-only" />
                  <CreditCard className={`h-4 w-4 ${paymentMethod === 'card' ? 'text-blue-600' : 'text-zinc-400'}`} />
                  <div className="flex-grow">
                    <p className="text-sm font-bold">Credit / Debit Card</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Visa, Mastercard, JCB</p>
                  </div>
                </Label>

                {paymentMethod === 'card' && (
                  <div className="space-y-2 px-1 animate-in slide-in-from-top-2">
                    <Input 
                      placeholder="Card Number" 
                      value={fakePaymentInfo.card}
                      onChange={(e) => setFakePaymentInfo({...fakePaymentInfo, card: e.target.value})}
                      className="bg-zinc-50"
                    />
                    <div className="flex gap-2">
                      <Input 
                        placeholder="MM/YY" 
                        value={fakePaymentInfo.expiry}
                        onChange={(e) => setFakePaymentInfo({...fakePaymentInfo, expiry: e.target.value})}
                        className="bg-zinc-50"
                      />
                      <Input placeholder="CVV" className="bg-zinc-50" />
                    </div>
                  </div>
                )}
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              onClick={handleCheckout}
              disabled={isPending || selectedIds.length === 0 || isBalanceInsufficient}
              className="w-full py-6 text-lg font-bold shadow-lg"
            >
              {isPending ? 'Processing...' : 
               selectedIds.length === 0 ? 'Select Items to Buy' :
               isBalanceInsufficient ? 'Insufficient Balance' : 'Complete Purchase'}
            </Button>
            
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-bold border border-destructive/20 w-full">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            {isBalanceInsufficient && (
              <p className="text-[10px] text-center font-bold text-red-500 uppercase tracking-tight">
                Top up your wallet to continue
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
