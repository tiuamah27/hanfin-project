"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useWallets, useAuth } from "@/hooks";
import { formatRupiahShort } from "@/lib/utils/formatters";
import { Menu, Search, Bell, Wallet } from "lucide-react";
import { toast } from "@/components/ui/toaster";

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
        "fixed top-4 right-4 z-30 h-14 flex items-center justify-between gap-4 px-6 rounded-2xl",
        "bg-[#0B0F19]/90 backdrop-blur-xl border border-border/50 shadow-sm",
        "transition-all duration-300",
        sidebarCollapsed
          ? "left-[calc(var(--spacing-sidebar-collapsed)+16px)]"
          : "left-[calc(var(--spacing-sidebar)+16px)]",
        "max-lg:left-4"
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
        <button onClick={() => toast.info("Belum ada notifikasi baru")} className="relative p-2.5 rounded-xl bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all group">
          <Bell className="w-4 h-4 group-hover:animate-swing" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
        </button>

        {/* User Avatar (mobile) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-8 h-8 rounded-full relative overflow-hidden"
        >
          {profile?.avatar_url ? (
            <>
              <img 
                src={profile.avatar_url} 
                alt={profile?.name || "User"} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-full h-full gradient-accent items-center justify-center text-white text-xs font-bold hidden flex">
                {profile?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </>
          ) : (
            <div className="w-full h-full gradient-accent flex items-center justify-center text-white text-xs font-bold">
              {profile?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
