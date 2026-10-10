import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aangan Enquiry Agent",
  description: "Turns a phone call into a qualified, booked, handed-off enquiry.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">Aangan</Link>
            <nav className="nav" aria-label="Main">
              <Link href="/">Dashboard</Link>
              <Link href="/new-call">New call</Link>
              <Link href="/review">Review queue</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
