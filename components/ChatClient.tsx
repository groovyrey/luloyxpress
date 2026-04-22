"use client";
import { useState, useEffect, useRef } from "react";
import { getAblyChannel } from "@/lib/ably";
import { sendMessage, Message, deleteMessage } from "@/lib/actions";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";
import { usePresence } from "./PresenceProvider";

interface ChatClientProps {
// ... existing props

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
  const { onlineUsers } = usePresence();
  const isOnline = onlineUsers.has(otherUserId);
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

    channel.subscribe("message_delete", (message) => {
      const { messageId } = message.data;
      setMessages((prev) => prev.filter(m => m.id !== messageId));
    });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, otherUserId]);

  const handleDeleteMessage = async (messageId: number) => {
    const result = await deleteMessage(messageId, parseInt(otherUserId));
    if (result.success) {
      setMessages((prev) => prev.filter(m => m.id !== messageId));
      const channel = getAblyChannel(currentUserId, otherUserId);
      channel.publish("message_delete", { messageId });
    } else {
      alert(result.error || "Failed to delete message");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsPending(true);
    
    // Auto-append product context if present
    let finalContent = content;
    if (productContext) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      finalContent += `\n\n> Inquiry: [${productContext.name}](${baseUrl}/products/${productContext.id})`;
    }

    const result = await sendMessage(parseInt(otherUserId), finalContent);
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
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          {otherUserName.charAt(0)}
        </div>
        <div>
          <h2 className="font-black text-zinc-900">{otherUserName}</h2>
          {isOnline ? (
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></span> Online
            </p>
          ) : (
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-300"></span> Offline
            </p>
          )}
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
                sizes="40px"
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
            <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} group/msg`}>
              <div className="flex items-end gap-2 max-w-[80%]">
                {isOwn && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="opacity-0 group-hover/msg:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                    title="Delete message"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                  </button>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm flex-grow ${
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
                      p: ({ children }) => <p className="m-0 break-words">{children}</p>,
                      blockquote: ({ children }) => (
                        <blockquote className={`border-l-4 pl-3 py-1 my-2 italic text-xs rounded-r-lg ${
                          isOwn 
                          ? "border-white/30 bg-white/10 text-white/90" 
                          : "border-blue-600/30 bg-blue-50 text-zinc-600"
                        }`}>
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  <p className={`text-[10px] mt-1 opacity-60 text-right ${isOwn ? "text-white" : "text-zinc-500"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-6 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              maxLength={100}
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
          {content.length > 0 && (
            <div className="flex justify-end px-4">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                content.length >= 90 ? "text-red-500" : "text-zinc-400"
              }`}>
                {content.length} / 100
              </span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
