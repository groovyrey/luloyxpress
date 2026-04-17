"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ably } from "@/lib/ably";
import { getConversations } from "@/lib/actions";

interface Conversation {
  id: number;
  name: string;
  email: string;
  last_message: string | null;
  last_message_at: string | Date | null;
  last_sender_id: number | null;
}

export default function ConversationsClient({ 
  initialConversations, 
  currentUserId 
}: { 
  initialConversations: Conversation[],
  currentUserId: string
}) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);

  const refreshConversations = async () => {
    const updated = await getConversations();
    setConversations(updated as unknown as Conversation[]);
  };

  useEffect(() => {
    const channel = ably.channels.get(`user:${currentUserId}`);
    
    // Listen for new messages to update the list
    channel.subscribe("new_message", () => {
      refreshConversations();
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId]);

  if (conversations.length === 0) {
    return (
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
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
      <div className="divide-y divide-zinc-100">
        {conversations.map((conv) => {
          const isOwn = conv.last_sender_id?.toString() === currentUserId;
          return (
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
                  {isOwn && <span className="text-zinc-400 mr-1">You:</span>}
                  {conv.last_message || 'Start a conversation...'}
                </p>
              </div>
              <div className="text-zinc-300 group-hover:text-blue-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
