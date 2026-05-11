"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ably } from "@/lib/ably";
import PresenceProvider from "./PresenceProvider";

interface LiveUpdatesContextType {
  cartCount: number;
  balance: string;
  unreadMessages: number;
  setUnreadMessages: (count: number) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const channel = ably.channels.get(`presence:${userId}`);
    channel.subscribe("update", (message) => {
      if (message.data.type === "cart_update") {
        setCartCount(message.data.count);
      }
      if (message.data.type === "balance_update") {
        setBalance(message.data.balance);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return (
    <PresenceProvider userId={userId}>
      <LiveUpdatesContext.Provider value={{ 
        cartCount, 
        balance, 
        unreadMessages, 
        setUnreadMessages,
        isSidebarOpen,
        setIsSidebarOpen
      }}>
        {children}
      </LiveUpdatesContext.Provider>
    </PresenceProvider>
  );
}
