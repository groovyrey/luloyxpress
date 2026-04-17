"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ably } from "@/lib/ably";
import PresenceProvider from "./PresenceProvider";

interface LiveUpdatesContextType {
// ...

  cartCount: number;
  balance: string;
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
}

const LiveUpdatesContext = createContext<LiveUpdatesContextType | undefined>(undefined);

export function useLiveUpdates() {
  const context = useContext(LiveUpdatesContext);
  if (!context) {
    throw new Error("useLiveUpdates must be used within a LiveUpdatesProvider");
  }
  return context;
}

export default function LiveUpdatesProvider({
  children,
  userId,
  initialCartCount,
  initialBalance,
}: {
  children: React.ReactNode;
  userId?: string;
  initialCartCount: number;
  initialBalance: string;
}) {
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [balance, setBalance] = useState(initialBalance);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const channel = ably.channels.get(`user:${userId}`);

    channel.subscribe("cart_update", (message) => {
      setCartCount(message.data.count);
    });

    channel.subscribe("balance_update", (message) => {
      setBalance(message.data.balance);
    });

    channel.subscribe("new_message", (message) => {
      // Only increment if we are not currently on the chat page with this user
      // (This is a simplified check, ideally we'd check current path)
      setUnreadMessages((prev) => prev + 1);
      
      // Optional: Show a browser notification or a custom toast here
      if (Notification.permission === "granted") {
        new Notification(`New message from ${message.data.senderName}`, {
          body: message.data.content,
        });
      }
    });

    // Request notification permission
    if (typeof window !== 'undefined' && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return (
    <PresenceProvider userId={userId}>
      <LiveUpdatesContext.Provider value={{ cartCount, balance, unreadMessages, setUnreadMessages }}>
        {children}
      </LiveUpdatesContext.Provider>
    </PresenceProvider>
  );
}
