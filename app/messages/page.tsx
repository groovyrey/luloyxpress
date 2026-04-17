import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/lib/actions";
import ConversationsClient from "@/components/ConversationsClient";

interface Conversation {
  id: number;
  name: string;
  email: string;
  last_message: string | null;
  last_message_at: string | Date | null;
  last_sender_id: number | null;
}

export default async function MessagesPage() {
  const session = await auth();
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const conversations = await getConversations() as unknown as Conversation[];

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Messages</h1>
          <p className="text-zinc-500 font-medium">Real-time conversations with buyers and sellers.</p>
        </div>

        <ConversationsClient 
          initialConversations={conversations} 
          currentUserId={session.user.id} 
        />
      </div>
    </div>
  );
}

