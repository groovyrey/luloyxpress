"use client";

import { useLiveUpdates } from "./LiveUpdatesProvider";
import { cn } from "@/lib/utils";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isSidebarExpanded } = useLiveUpdates();

  return (
    <main 
      className={cn(
        "flex-1 overflow-y-auto bg-zinc-50/30 pt-16 transition-[padding] duration-300 ease-in-out min-h-screen",
        isSidebarExpanded ? "md:pl-72" : "md:pl-24"
      )}
    >
      {children}
    </main>
  );
}
