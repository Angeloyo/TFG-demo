import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MIMIC-IV Analytics",
  description: "Clinical Data Visualization and Analytics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <Header />
        <main className="pt-20">
          {children}
        </main>
        {process.env.NODE_ENV === 'production' && (
          <Script
            defer
            src="https://analytics.angeloyo.com/script.js"
            data-website-id="3be853bb-5aa6-4f14-a436-cbc9eb56f27f"
          />
        )}
      </body>
    </html>
  );
}
