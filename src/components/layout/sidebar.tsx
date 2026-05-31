"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useBillsUnpaidCount, useAuth } from "@/hooks";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Receipt,
  Target,
  PieChart,
  BarChart3,
  Calendar,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/wallets", label: "Wallets", icon: Wallet },
  { href: "/bills", label: "Tagihan", icon: Receipt, badge: true },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/budget", label: "Budget", icon: PieChart },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/calendar", label: "Kalender", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { data: unpaidCount } = useBillsUnpaidCount();
  const { profile, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <Image 
            src="https://slywtekcxvcakeqmabcx.supabase.co/storage/v1/object/public/logo/logo-hanfin.jpg" 
            alt="HanFin Logo" 
            width={36}
            height={36}
            className="rounded-xl object-cover shrink-0 min-w-[36px] min-h-[36px]"
          />
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">HanFin</h1>
              <p className="text-[10px] text-muted-foreground font-mono tracking-wider">PROJECT</p>
            </div>
          )}
        </Link>

        {/* Mobile close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-card text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "text-primary bg-primary-dim"
                  : "text-muted-foreground hover:text-foreground hover:bg-card",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px] shrink-0", active && "text-primary")} />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.badge && !sidebarCollapsed && unpaidCount && unpaidCount > 0 ? (
                <span className="ml-auto text-[10px] font-mono font-bold bg-red/20 text-red px-1.5 py-0.5 rounded-full">
                  {unpaidCount}
                </span>
              ) : null}
              {item.badge && sidebarCollapsed && unpaidCount && unpaidCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-1">
        <button
          onClick={toggleSidebarCollapsed}
          className={cn(
            "hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-card",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
          {!sidebarCollapsed && <span>Ciutkan Sidebar</span>}
        </button>
        <div className="border-t border-border my-2" />

        {/* User Profile */}
        {profile && (
          <div className="mt-2 space-y-2">
            <div
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-card/50 border border-transparent",
                sidebarCollapsed && "justify-center px-0 flex-col-reverse gap-3"
              )}
            >
              <div className="relative shrink-0 min-w-[32px] min-h-[32px]">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.name} 
                    width={32}
                    height={32}
                    className="rounded-full object-cover border border-border/50"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={cn("w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold", profile.avatar_url ? "hidden" : "")}>
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{profile.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{profile.role}</p>
                </div>
              )}
              
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className={cn(
                  "p-1.5 rounded-lg text-muted-foreground hover:bg-red/10 hover:text-red transition-colors shrink-0",
                  sidebarCollapsed && "w-8 h-8 flex items-center justify-center bg-card/80 hover:bg-red/10"
                )}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 glass-sidebar transition-all duration-300 transition-colors duration-300",
          sidebarCollapsed ? "w-[var(--spacing-sidebar-collapsed)]" : "w-[var(--spacing-sidebar)]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[280px] glass-sidebar"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm glass-card border border-border/50 shadow-2xl p-6 rounded-2xl flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center mb-4">
                <LogOut className="w-6 h-6 text-red" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Keluar dari HanFin?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Anda harus login kembali untuk mengakses dashboard keuangan Anda.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border/50 text-sm font-medium hover:bg-card transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    signOut();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-red/20"
                >
                  Ya, Keluar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
