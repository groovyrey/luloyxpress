import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { auth } from "@/auth";
import LiveUpdatesProvider from "@/components/LiveUpdatesProvider";
import { Suspense } from "react";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-white`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <LiveUpdatesProvider
          userId={session?.user?.id}
          initialCartCount={0}
          initialBalance="0"
        >
          <Suspense fallback={<div className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md" />}>
            <Navbar />
          </Suspense>
          {children}
          <Toaster position="top-center" richColors />
        </LiveUpdatesProvider>
      </body>
    </html>
  );
}
