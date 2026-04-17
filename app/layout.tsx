import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { auth } from "@/auth";
import { getCartCount } from "@/lib/actions";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import LiveUpdatesProvider from "@/components/LiveUpdatesProvider";

async function getUserBalance(userId: string) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT balance FROM users WHERE id = ?", [userId]);
    return rows[0]?.balance || "0";
  } catch {
    return "0";
  }
}

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
  const cartCount = await getCartCount();
  const balance = session?.user?.id ? await getUserBalance(session.user.id) : "0";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-white`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <LiveUpdatesProvider
          userId={session?.user?.id}
          initialCartCount={cartCount}
          initialBalance={balance}
        >
          <Navbar />
          {children}
        </LiveUpdatesProvider>
      </body>
    </html>
  );
}
