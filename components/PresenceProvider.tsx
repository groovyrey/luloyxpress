"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ably } from "@/lib/ably";

interface PresenceContextType {
  onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error("usePresence must be used within a PresenceProvider");
  }
  return context;
}

export default function PresenceProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setOnlineUsers(new Set());
      return;
    }

    // Use a global presence channel
    const channel = ably.channels.get("global-presence");

    const updatePresence = async () => {
      const members = await channel.presence.get();
      const userIds = new Set(members.map((m) => m.clientId));
      setOnlineUsers(userIds);
    };

    channel.presence.subscribe("enter", (member) => {
      setOnlineUsers((prev) => new Set(prev).add(member.clientId));
    });

    channel.presence.subscribe("leave", (member) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(member.clientId);
        return next;
      });
    });

    channel.presence.enter();
    updatePresence();

    return () => {
      channel.presence.leave();
      channel.presence.unsubscribe();
    };
  }, [userId]);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}
