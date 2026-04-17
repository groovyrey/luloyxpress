import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getConversations } from "@/lib/actions";

interface Conversation {
  id: number;
  name: string;
  email: string;
  last_message: string | null;
  last_message_at: string | Date | null;
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

        {conversations.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-zinc-200 shadow-sm">
            <div className="mb-4 flex justify-center text-zinc-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2">No conversations yet</h2>
            <p className="text-zinc-500 mb-6">When you message a seller, your chat will appear here.</p>
            <Link href="/shop" className="inline-block rounded-full bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100">
              {conversations.map((conv) => (
                <Link 
                  key={conv.id} 
                  href={`/messages/${conv.id}`}
                  className="flex items-center gap-4 p-6 hover:bg-zinc-50 transition-all group"
                >
                  <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center text-blue-600 font-black text-xl border-2 border-zinc-50 group-hover:border-blue-100 group-hover:bg-white transition-all">
                    {conv.name.charAt(0)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-zinc-900 truncate">{conv.name}</h3>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 truncate font-medium">
                      {conv.last_message || 'Start a conversation...'}
                    </p>
                  </div>
                  <div className="text-zinc-300 group-hover:text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
