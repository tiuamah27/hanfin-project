import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "HanFin Project — Family Finance Dashboard",
    template: "%s | HanFin"
  },
  description:
    "Premium family finance management dashboard. Track expenses, income, PayLater installments, budgets, goals, and more.",
  keywords: ["finance", "family", "dashboard", "budget", "paylater", "wallet"],
  authors: [{ name: "HanFin Project" }],
  openGraph: {
    title: "HanFin Project — Family Finance",
    description: "Premium family finance management dashboard.",
    url: "/",
    siteName: "HanFin",
    images: [
      {
        url: "https://slywtekcxvcakeqmabcx.supabase.co/storage/v1/object/public/logo/logo-hanfin.jpg",
        width: 800,
        height: 800,
        alt: "HanFin Project Logo",
      }
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
