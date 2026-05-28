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
  title: "HanFin Project — Family Finance Dashboard",
  description:
    "Premium family finance management dashboard. Track expenses, income, PayLater installments, budgets, goals, and more.",
  keywords: ["finance", "family", "dashboard", "budget", "paylater", "wallet"],
  authors: [{ name: "HanFin Project" }],
  icons: {
    icon: "https://slywtekcxvcakeqmabcx.supabase.co/storage/v1/object/public/logo/logo-hanfin.jpg",
  },
  openGraph: {
    title: "HanFin Project — Family Finance Dashboard",
    description: "Premium family finance management dashboard. Track expenses, income, PayLater installments, budgets, goals, and more.",
    url: "https://hanfin.tiuserver.my.id",
    siteName: "HanFin Project",
    images: [
      {
        url: "https://slywtekcxvcakeqmabcx.supabase.co/storage/v1/object/public/logo/logo-hanfin.jpg",
        width: 800,
        height: 800,
        alt: "HanFin Logo",
      },
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
