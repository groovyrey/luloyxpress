import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import ChatClient from "@/components/ChatClient";
import { getMessages } from "@/lib/actions";
import { RowDataPacket } from "mysql2";
import { formatPrice } from "@/lib/currency";

async function getOtherUser(userId: string) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name FROM users WHERE id = ?",
      [userId]
    );
    return rows[0];
  } catch {
    return null;
  }
}

async function getProduct(productId: string) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, price, image FROM products WHERE id = ?",
      [productId]
    );
    return rows[0];
  } catch {
    return null;
  }
}

export default async function ChatPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ userId: string }>,
  searchParams: Promise<{ product?: string }>
}) {
  const { userId: otherUserId } = await params;
  const { product: productId } = await searchParams;
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  if (session.user.id === otherUserId) {
    redirect("/messages");
  }

  const otherUser = await getOtherUser(otherUserId);
  if (!otherUser) {
    notFound();
  }

  const product = productId ? await getProduct(productId) : null;
  const initialMessages = await getMessages(parseInt(otherUserId));

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <ChatClient
          currentUserId={session.user.id}
          otherUserId={otherUserId}
          otherUserName={otherUser.name}
          initialMessages={initialMessages}
          productContext={product ? {
            id: product.id,
            name: product.name,
            price: formatPrice(product.price),
            image: product.image
          } : undefined}
        />
      </div>
    </div>
  );
}
