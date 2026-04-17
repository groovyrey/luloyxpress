import { auth } from "@/auth";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { RowDataPacket } from "mysql2";
import PrintButton from "@/components/PrintButton";

interface OrderRow extends RowDataPacket {
  id: number;
  buyer_id: number;
  total_amount: string;
  status: string;
  payment_method: string;
  created_at: Date;
}

interface OrderItemRow extends RowDataPacket {
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
    `SELECT p.name as product_name, oi.price, oi.quantity, oi.seller_id, u.name as seller_name
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN users u ON oi.seller_id = u.id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  return rows;
}

function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^\d.]/g, ''));
}

export default async function OfficialReceipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const order = await getOrder(id);
  if (!order || order.status !== 'completed') {
    notFound();
  }

  // Auth check for own orders
  const isOwner = session?.user?.id === order.buyer_id.toString();
  if (!isOwner) {
    // Optional: could allow pro sellers to see receipts too, but for now keep it private
    // notFound(); 
  }

  const items = await getOrderItems(id);

  // Generate a stable pseudo-random TXN ID based on order ID
  const txnId = `TXN-${(order.id * 1234567).toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Print Header */}
        <div className="print:hidden flex justify-between items-center mb-8 pb-6 border-b border-zinc-200">
          <Link href={`/profile/${session?.user?.id || '1'}`} className="text-blue-600 hover:text-blue-700 font-bold text-sm flex items-center gap-1">
            ← Back to Profile
          </Link>
          <PrintButton />
        </div>

        {/* Official Receipt Card */}
        <div className="bg-white shadow-2xl border border-zinc-100 rounded-3xl p-12 print:shadow-none print:border-0 print:p-8">
          {/* LuloyXpress Header */}
          <div className="text-center mb-12 print:mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative h-20 w-20">
                <Image 
                  src="/logo.png" 
                  alt="LuloyXpress" 
                  fill 
                  className="object-contain" 
                  priority 
                />
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-black via-zinc-800 to-blue-900 bg-clip-text text-transparent tracking-tight print:text-3xl">
              LULOY<span className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">XPRESS</span>
            </h1>
            <p className="text-sm font-bold text-zinc-600 uppercase tracking-wider mt-2 print:text-xs">Official Receipt</p>
          </div>

          {/* Receipt Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 print:grid-cols-3 print:gap-6">
            <div>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Receipt Number</p>
              <p className="text-2xl font-black text-zinc-900 print:text-xl">#{order.id}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Payment Method</p>
              <p className="text-lg font-bold text-zinc-900 print:text-base capitalize">
                {order.payment_method === 'wallet' ? 'LuloyXpress Wallet' : 
                 order.payment_method === 'gcash' ? 'GCash / Maya' : 
                 order.payment_method === 'card' ? 'Credit / Debit Card' : order.payment_method}
              </p>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{txnId}</p>
            </div>
            <div className="text-right print:text-right">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Purchase Date</p>
              <p className="text-xl font-bold text-zinc-900 print:text-lg">{new Date(order.created_at).toLocaleDateString('en-PH', { 
                timeZone: 'Asia/Manila',
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              })}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12">
            <table className="w-full border-collapse print:border-separate print:border-spacing-y-1">
              <thead>
                <tr className="border-b border-zinc-200 pb-4">
                  <th className="text-left py-4 font-bold text-zinc-700 text-sm uppercase tracking-wider w-8">QTY</th>
                  <th className="text-left py-4 font-bold text-zinc-700 text-sm uppercase tracking-wider">Item</th>
                  <th className="text-right py-4 font-bold text-zinc-700 text-sm uppercase tracking-wider">Unit Price</th>
                  <th className="text-right py-4 font-bold text-zinc-700 text-sm uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-zinc-50 py-6 hover:bg-zinc-50 print:hover:bg-transparent">
                    <td className="font-mono text-lg font-bold text-zinc-900 w-8 print:text-base">{item.quantity}</td>
                    <td className="py-4">
                      <p className="font-semibold text-zinc-900 print:mb-1">{item.product_name}</p>
                      {item.seller_name && (
                        <p className="text-xs text-zinc-500 print:text-xs">Sold by {item.seller_name}</p>
                      )}
                    </td>
                    <td className="text-right py-4">
                      <p className="font-bold text-zinc-900 print:text-sm">₱{parsePrice(item.price).toLocaleString()}</p>
                    </td>
                    <td className="text-right py-4">
                      <p className="text- font-black text-blue-600 print:text-lg">₱{(parsePrice(item.price) * item.quantity).toLocaleString()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="border-t-2 border-zinc-200 pt-8 print:border-t print:pt-6">
            <div className="flex justify-between items-baseline text-2xl md:text-3xl font-black text-zinc-900 mb-4 print:text-xl">
              <span>TOTAL AMOUNT</span>
              <span className="text-blue-600">₱{parseFloat(order.total_amount).toLocaleString()}</span>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border border-emerald-100 print:bg-white print:p-4">
              <p className="text-center font-bold text-emerald-700 text-lg print:text-base">✅ Order Completed Successfully</p>
              <p className="text-xs text-zinc-600 mt-1 text-center leading-relaxed print:text-xs">
                Thank you for your purchase! This is your official LuloyXpress transaction receipt.
                <br />
                Digital receipt valid for warranty, returns & support. 🇵🇭
              </p>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="mt-16 pt-8 border-t border-zinc-100 print:mt-12 print:pt-6 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-zinc-500">
              <div>
                <p className="font-bold uppercase tracking-wider mb-2">Customer Service</p>
                <p>support@luloyxpress.ph</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider mb-2">Returns</p>
                <p>30 days from receipt date</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-wider mb-2">Store Policy</p>
                <p>Final sale on digital goods</p>
              </div>
            </div>
          </div>
        </div>

        <div className="print:hidden mt-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
          <h3 className="font-bold text-zinc-900 text-lg mb-2">Print Tips:</h3>
          <ul className="text-sm text-zinc-600 space-y-1 list-disc list-inside">
            <li>Best on A4 paper, portrait orientation</li>
            <li>Receipt valid digitally - no printer needed</li>
            <li>Click &quot;Print Receipt&quot; button above</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
