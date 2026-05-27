"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ArrowLeftRight, Wallet, Receipt, Target } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/bills", label: "Tagihan", icon: Receipt },
  { href: "/goals", label: "Goals", icon: Target },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-40 bg-[#0B0F19]/90 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl py-3 px-6">
      <div className="flex items-center justify-between h-full">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative p-2 flex flex-col items-center justify-center transition-all group"
            >
              <item.icon 
                className={cn(
                  "w-[22px] h-[22px] transition-colors", 
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} 
                strokeWidth={active ? 2.5 : 2}
              />
              {/* Active Indicator Line */}
              <div 
                className={cn(
                  "absolute -bottom-1 w-5 h-0.5 rounded-full bg-primary transition-all duration-300",
                  active ? "opacity-100 scale-100" : "opacity-0 scale-0"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
