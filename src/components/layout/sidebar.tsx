"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useBillsUnpaidCount, useAuth } from "@/hooks";
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
  Settings,
  ChevronLeft,
  LogOut,
  X,
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

const bottomItems = [
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { data: unpaidCount } = useBillsUnpaidCount();
  const { profile, signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <div className="w-9 h-9 rounded-xl gradient-accent flex items-center justify-center text-white font-bold text-sm">
            H
          </div>
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

        {/* Desktop collapse */}
        <button
          onClick={toggleSidebarCollapsed}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-card text-muted-foreground transition-colors"
        >
          <ChevronLeft
            className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        <p className={cn(
          "px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-dim",
          sidebarCollapsed && "text-center"
        )}>
          {sidebarCollapsed ? "•••" : "Menu"}
        </p>
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
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
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
        <div className="border-t border-border my-3" />
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "text-primary bg-primary-dim"
                  : "text-muted-foreground hover:text-foreground hover:bg-card",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User Profile */}
        {profile && !sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-card/50">
            <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{profile.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{profile.role}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg hover:bg-red-dim text-muted-foreground hover:text-red transition-colors"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
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
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 glass-sidebar transition-all duration-300",
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
    </>
  );
}
