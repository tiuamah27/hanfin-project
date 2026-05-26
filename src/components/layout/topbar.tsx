"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useWallets, useAuth } from "@/hooks";
import { formatRupiahShort } from "@/lib/utils/formatters";
import { Menu, Search, Bell, Wallet } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transaksi",
  "/wallets": "Wallets",
  "/bills": "Tagihan",
  "/goals": "Goals",
  "/budget": "Budget",
  "/reports": "Laporan",
  "/calendar": "Kalender",
  "/settings": "Pengaturan",
};

export function Topbar() {
  const pathname = usePathname();
  const { setSidebarOpen, sidebarCollapsed } = useUIStore();
  const { data: wallets } = useWallets();
  const { profile } = useAuth();

  const totalBalance = (wallets || [])
    .filter((w) => w.is_active && w.wallet_category !== "liability")
    .reduce((sum, w) => sum + Number(w.balance || 0), 0);

  const pageTitle = pageTitles[pathname] || "HanFin";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-[var(--spacing-topbar)] flex items-center justify-between gap-4 px-6",
        "glass border-b border-border",
        "transition-all duration-300",
        sidebarCollapsed
          ? "left-[var(--spacing-sidebar-collapsed)]"
          : "left-[var(--spacing-sidebar)]",
        "max-lg:left-0"
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl hover:bg-card text-muted-foreground transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-semibold text-foreground">{pageTitle}</h2>
          {profile && (
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Selamat datang, {profile.name} 👋
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border text-muted-foreground text-sm w-56 cursor-pointer hover:border-border-bright transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Cari...</span>
          <kbd className="ml-auto text-[10px] font-mono text-dim bg-surface px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </div>

        {/* Wallet Quick Stat */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono font-semibold text-foreground">
            {formatRupiahShort(totalBalance)}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-card text-muted-foreground transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
        </button>

        {/* User Avatar (mobile) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold"
        >
          {profile?.name?.charAt(0)?.toUpperCase() || "U"}
        </button>
      </div>
    </header>
  );
}
