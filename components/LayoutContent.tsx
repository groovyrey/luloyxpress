"use client";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto bg-zinc-50/30 pt-16 min-h-screen">
      {children}
    </main>
  );
}
