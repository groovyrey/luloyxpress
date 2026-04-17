"use client";

import { useState, useEffect, useRef } from "react";
import { getAblyChannel } from "@/lib/ably";
import { sendMessage, Message } from "@/lib/actions";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";

interface ChatClientProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  initialMessages: Message[];
  productContext?: {
    id: number;
    name: string;
    price: string;
    image: string;
  };
}

export default function ChatClient({ 
  currentUserId, 
  otherUserId, 
  otherUserName, 
  initialMessages,
  productContext 
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [isSending, setIsPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const channel = getAblyChannel(currentUserId, otherUserId);
    
    channel.subscribe("message", (message) => {
      const newMessage = message.data as Message;
      setMessages((prev) => {
        if (prev.find(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, otherUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsPending(true);
    const result = await sendMessage(parseInt(otherUserId), content);
    setIsPending(false);

    if (result.success && result.message) {
      setContent("");
      const channel = getAblyChannel(currentUserId, otherUserId);
      channel.publish("message", result.message);
    } else {
      alert(result.error || "Failed to send message");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          {otherUserName.charAt(0)}
        </div>
        <div>
          <h2 className="font-black text-zinc-900">{otherUserName}</h2>
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span> Online
          </p>
        </div>
      </div>

      {/* Product Context Banner */}
      {productContext && (
        <div className="px-6 py-3 bg-blue-50/50 border-b border-zinc-100 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-zinc-200 bg-white">
              <Image 
                src={productContext.image} 
                alt={productContext.name} 
                fill 
                className="object-contain p-1"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Inquiring about</p>
              <Link 
                href={`/products/${productContext.id}`}
                className="text-sm font-bold text-zinc-900 hover:text-blue-600 transition-colors line-clamp-1"
              >
                {productContext.name}
              </Link>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-blue-600">{productContext.price}</p>
            <Link 
              href={`/products/${productContext.id}`}
              className="text-[10px] font-bold text-zinc-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest"
            >
              View Item →
            </Link>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.sender_id.toString() === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                isOwn 
                ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/20" 
                : "bg-zinc-100 text-zinc-900 rounded-tl-none"
              }`}>
                <ReactMarkdown
                  components={{
                    a: ({ ...props }) => (
                      <a 
                        {...props} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`underline decoration-2 underline-offset-2 font-bold hover:opacity-80 transition-opacity ${
                          isOwn ? "text-white" : "text-blue-600"
                        }`} 
                      />
                    ),
                    p: ({ children }) => <p className="m-0 break-words">{children}</p>
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
                <p className={`text-[10px] mt-1 opacity-60 text-right ${isOwn ? "text-white" : "text-zinc-500"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          <button
            type="submit"
            disabled={isSending || !content.trim()}
            className="rounded-full bg-black px-6 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSending ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
