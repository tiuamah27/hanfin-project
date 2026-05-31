"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useWallets, useAuth } from "@/hooks";
import { formatRupiahShort } from "@/lib/utils/formatters";
import { Menu, Search, Bell, Wallet, Trash2, CheckCheck, MoreHorizontal, Moon, Sun } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/components/ui/toaster";
import Image from "next/image";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Classic } from "@/components/ui/classic-theme-toggle";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transaksi",
  "/wallets": "Wallets",
  "/bills": "Tagihan",
  "/goals": "Goals",
  "/budget": "Budget",
  "/reports": "Laporan",
  "/calendar": "Kalender",
};

import { useNotificationStore } from "@/stores/notification-store";
function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mnt`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam`;
  const days = Math.floor(hours / 24);
  return `${days} hr`;
}

export function Topbar() {
  const pathname = usePathname();
  const { setSidebarOpen, sidebarCollapsed } = useUIStore();
  const { data: wallets } = useWallets();
  const { profile } = useAuth();
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const { theme, setTheme } = useTheme();
  
  const [showNotif, setShowNotif] = useState(false);
  const [filterNotif, setFilterNotif] = useState<'all' | 'unread'>('all');
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside the menu
      if (menuRef.current && menuRef.current.contains(event.target as Node)) {
        return;
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
        setShowNotifMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalBalance = (wallets || [])
    .filter((w) => w.is_active && w.wallet_category !== "liability")
    .reduce((sum, w) => sum + Number(w.balance || 0), 0);

  const pageTitle = pageTitles[pathname] || "HanFin";

  return (
    <header
      className={cn(
        "fixed top-4 right-4 z-30 h-14 flex items-center justify-between gap-4 px-6 rounded-2xl",
        "bg-background/90 backdrop-blur-xl border border-border/50 shadow-sm",
        "transition-all duration-300 transition-colors duration-300 left-4",
        sidebarCollapsed
          ? "lg:left-[calc(var(--spacing-sidebar-collapsed)+16px)]"
          : "lg:left-[calc(var(--spacing-sidebar)+16px)]"
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
        {/* Wallet Quick Stat */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border">
          <Wallet className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono font-semibold text-foreground">
            {formatRupiahShort(totalBalance)}
          </span>
        </div>

        {/* Theme Toggle */}
        <Classic
          duration={300}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4"
          title="Ganti Tema"
        />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)} 
            className="relative w-9 h-9 rounded-xl bg-card border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all group flex items-center justify-center"
          >
            <Bell className="w-4 h-4 group-hover:animate-swing" />
            {notifications.some(n => n.isNew) && (
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
            )}
          </button>
          
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+8px)] -right-[52px] sm:right-0 w-[calc(100vw-48px)] sm:w-[360px] max-w-[360px] max-h-[85vh] overflow-y-auto custom-scrollbar bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl z-50 flex flex-col rounded-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 relative">
                  <h3 className="text-xl font-bold text-foreground">Notifikasi</h3>
                  {notifications.length > 0 && (
                    <div ref={menuRef}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNotifMenu(!showNotifMenu);
                        }}
                        className="w-8 h-8 rounded-full hover:bg-surface flex items-center justify-center text-muted-foreground transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      <AnimatePresence>
                        {showNotifMenu && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-4 top-12 w-56 bg-card border border-border/50 shadow-2xl rounded-xl overflow-hidden z-[60]"
                          >
                            <button
                              onClick={() => {
                                markAllAsRead();
                                setShowNotifMenu(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-surface transition-colors text-left"
                            >
                              <CheckCheck className="w-4 h-4 text-primary" />
                              Tandai semua dibaca
                            </button>
                            <button
                              onClick={() => {
                                setShowClearConfirm(true);
                                setShowNotifMenu(false);
                                setShowNotif(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red hover:bg-red/10 transition-colors text-left border-t border-border/30"
                            >
                              <Trash2 className="w-4 h-4" />
                              Bersihkan semua
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                
                {/* Filters */}
                <div className="px-4 pb-2 flex gap-2">
                  <button 
                    onClick={() => setFilterNotif('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                      filterNotif === 'all' ? "bg-primary/20 text-primary" : "hover:bg-surface text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Semua
                  </button>
                  <button 
                    onClick={() => setFilterNotif('unread')}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                      filterNotif === 'unread' ? "bg-primary/20 text-primary" : "hover:bg-surface text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Belum Dibaca
                  </button>
                </div>
                
                {(() => {
                  const filteredNotifications = notifications.filter(n => filterNotif === 'all' || n.isNew);
                  
                  if (filteredNotifications.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">
                          {filterNotif === 'unread' ? "Tidak ada notifikasi yang belum dibaca" : "Belum ada notifikasi baru"}
                        </p>
                      </div>
                    );
                  }

                  const newNotifs = filteredNotifications.filter(n => n.isNew);
                  const oldNotifs = filteredNotifications.filter(n => !n.isNew);

                  return (
                    <>
                      {/* Section: Baru */}
                      {newNotifs.length > 0 && (
                        <>
                          <div className="flex items-center justify-between px-4 mt-2">
                            <h4 className="text-sm font-bold text-foreground">Baru</h4>
                            <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Tandai dibaca</button>
                          </div>
                          
                          <div className="flex flex-col py-2">
                            {newNotifs.map(n => (
                              <button 
                                key={n.id} 
                                onClick={() => markAsRead(n.id)}
                                className="relative flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left w-full"
                              >
                                <div className="w-10 h-10 rounded-full bg-surface overflow-hidden shrink-0 border border-border/50">
                                  {n.avatar ? (
                                    <Image src={n.avatar} alt="avatar" width={40} height={40} className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple/30 flex items-center justify-center">
                                      <Bell className="w-4 h-4 text-primary" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                  <p className="text-xs text-foreground line-clamp-2 leading-tight">
                                    {n.title}
                                  </p>
                                  <p className="text-[10px] font-bold text-primary mt-1">
                                    {formatTimeAgo(n.time)}
                                  </p>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      
                      {/* Section: Terdahulu */}
                      {oldNotifs.length > 0 && (
                        <>
                          <div className="flex items-center justify-between px-4 mt-1">
                            <h4 className="text-sm font-bold text-foreground">Terdahulu</h4>
                          </div>
                          
                          <div className="flex flex-col py-2 pb-4">
                            {oldNotifs.map(n => (
                              <div key={n.id} className="relative flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left w-full">
                                <div className="w-10 h-10 rounded-full bg-surface overflow-hidden shrink-0 border border-border/50">
                                  {n.avatar ? (
                                    <Image src={n.avatar} alt="avatar" width={40} height={40} className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple/10 flex items-center justify-center">
                                      <Bell className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                  <p className="text-xs text-foreground line-clamp-2 leading-tight">
                                    {n.title}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {formatTimeAgo(n.time)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
                    

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar (mobile) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden w-8 h-8 rounded-full relative overflow-hidden"
        >
          {profile?.avatar_url ? (
            <>
              <Image 
                src={profile.avatar_url} 
                alt={profile?.name || "User"} 
                width={32}
                height={32}
                className="object-cover"
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

      <ConfirmModal
        isOpen={showClearConfirm}
        title="Bersihkan Semua Notifikasi?"
        message="Semua riwayat notifikasi akan dihapus. Tindakan ini tidak dapat dibatalkan."
        onConfirm={clearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </header>
  );
}
