import { auth } from "@/auth";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { RowDataPacket } from "mysql2";
import PrintButton from "@/components/PrintButton";
import { formatPrice, parsePriceToDecimal } from "@/lib/currency";

interface OrderRow extends RowDataPacket {
  id: number;
  buyer_id: number;
  total_amount: string;
  status: string;
  payment_method: string;
  created_at: Date;
}

interface OrderItemRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  price: string;
  quantity: number;
  seller_id: number;
  seller_name?: string;
}

async function getOrder(orderId: string) {
  const [rows] = await pool.query<OrderRow[]>(
    "SELECT * FROM orders WHERE id = ?",
    [orderId]
  );
  return rows[0];
}

async function getOrderItems(orderId: string) {
  const [rows] = await pool.query<OrderItemRow[]>(
    `SELECT 
       COALESCE(p.name, oi.product_name_at_purchase) as product_name, 
       oi.price, oi.quantity, oi.seller_id, u.name as seller_name
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     LEFT JOIN users u ON oi.seller_id = u.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return rows;
}

export default async function OfficialReceipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const order = await getOrder(id);
  if (!order || order.status !== 'completed') {
    notFound();
  }

  const items = await getOrderItems(id);

  // Generate a stable pseudo-random TXN ID based on order ID
  const txnId = `TXN-${(order.id * 1234567).toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 font-mono">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Print Header */}
        <div className="print:hidden flex justify-between items-center pb-4 border-b border-zinc-300">
          <Link href={`/profile/${session?.user?.id || '1'}`} className="text-zinc-600 hover:text-black font-bold text-xs uppercase tracking-tighter">
            ← Back
          </Link>
          <PrintButton />
        </div>

        {/* Simplified Receipt Card */}
        <div className="bg-white border border-zinc-300 p-8 shadow-sm print:border-0 print:shadow-none">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-dashed border-zinc-200 pb-8">
            <div className="flex justify-center mb-2">
              <div className="relative h-12 w-12 grayscale">
                <Image 
                  src="/logo.png" 
                  alt="LuloyXpress" 
                  fill 
                  sizes="48px"
                  className="object-contain" 
                  priority 
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-zinc-900">LULOYXPRESS</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Digital Marketplace Terminal</p>
          </div>

          {/* Metadata */}
          <div className="space-y-1 text-xs mb-8">
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase">Receipt No:</span>
              <span className="font-bold">#{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase">Date:</span>
              <span className="font-bold">{new Date(order.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase">Payment:</span>
              <span className="font-bold uppercase">{order.payment_method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 uppercase">Ref ID:</span>
              <span className="font-bold text-[10px]">{txnId}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8 border-y border-zinc-200 py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 uppercase text-[10px] border-b border-zinc-100">
                  <th className="text-left pb-2 font-normal">Description</th>
                  <th className="text-center pb-2 font-normal">Qty</th>
                  <th className="text-right pb-2 font-normal">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((item, idx) => {
                  const unitPrice = parsePriceToDecimal(item.price);
                  const itemTotal = unitPrice * item.quantity;
                  return (
                    <tr key={idx}>
                      <td className="py-3">
                        <p className="font-bold text-zinc-900">{item.product_name}</p>
                        {item.seller_name && (
                          <p className="text-[10px] text-zinc-400">Seller: {item.seller_name}</p>
                        )}
                      </td>
                      <td className="text-center py-3">{item.quantity}</td>
                      <td className="text-right py-3 font-bold">{formatPrice(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-sm font-bold border-t-2 border-zinc-900 pt-4">
              <span>TOTAL</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-dashed border-zinc-200 pt-8">
            <p className="text-[10px] font-bold text-zinc-900 mb-2 uppercase tracking-tighter">Order Completed</p>
            <p className="text-[9px] text-zinc-400 leading-tight">
              Thank you for supporting independent sellers.
              <br />
              This digital receipt serves as your proof of purchase.
            </p>
            <div className="mt-6 text-[8px] text-zinc-300 uppercase tracking-[0.2em]">
              LuloyXpress / {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* Minimal Print Notice */}
        <div className="print:hidden text-center">
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
            Verified Transaction Receipt
          </p>
        </div>
      </div>
    </div>
  );
}
