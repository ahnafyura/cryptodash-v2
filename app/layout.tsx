import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CryptoDash",
  description: "Live crypto prices and an honest BTC 24-hour projection with calibrated uncertainty.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <header className="border-b border-rule">
          <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
            <Link href="/" className="text-[15px] font-semibold tracking-tight">CryptoDash</Link>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="/" className="hover:text-ink">Market</Link>
              <Link href="/projection" className="hover:text-ink">BTC projection</Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted md:px-6">
            Market data from the Binance public API. Projection from a personal research project. Not financial advice.
          </div>
        </footer>
      </body>
    </html>
  );
}
