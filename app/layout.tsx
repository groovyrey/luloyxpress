import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { auth } from "@/auth";
import LiveUpdatesProvider from "@/components/LiveUpdatesProvider";
import LayoutContent from "@/components/LayoutContent";
import { getCartCount, getUserBalance } from "@/lib/actions";
import { Suspense } from "react";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LuloyXpress | Premium Online Shopping",
  description: "Style that speaks for itself. Discover our curated selection of premium products.",
  icons: {
    icon: "/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userId = session?.user?.id;
  
  // Pre-fetch initial data for global state
  const [initialCartCount, initialBalance] = await Promise.all([
    getCartCount(),
    userId ? getUserBalance(userId) : Promise.resolve("0")
  ]);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased bg-white`}
    >
      <body className="h-full bg-white font-sans">
        <LiveUpdatesProvider
          userId={userId}
          initialCartCount={initialCartCount}
          initialBalance={initialBalance}
        >
          <div className="flex flex-col h-full min-h-screen">
            <Suspense fallback={<div className="fixed top-0 left-0 right-0 h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md z-50" />}>
              <Navbar />
            </Suspense>
            <LayoutContent>
              {children}
            </LayoutContent>
          </div>
          <Toaster position="top-center" richColors />
        </LiveUpdatesProvider>
      </body>
    </html>
  );
}
