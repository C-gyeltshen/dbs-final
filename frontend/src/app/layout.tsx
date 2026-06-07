import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { Footer } from "@/components/Footer";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "1MinuteShop — Storefront",
  description: "Shop electronics, accessories, furniture and more",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
      style={
        {
          "--font-sans": "var(--font-space-grotesk), system-ui, sans-serif",
          "--font-mono": "var(--font-space-mono), monospace",
        } as React.CSSProperties
      }
    >
      <body>
        <AppProviders>{children}</AppProviders>
        <Footer />
      </body>
    </html>
  );
}
