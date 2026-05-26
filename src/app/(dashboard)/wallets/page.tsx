"use client";

import { motion } from "framer-motion";
import { useWallets, useAuth, useDeleteWallet } from "@/hooks";
import { formatRupiah, formatRupiahShort } from "@/lib/utils/formatters";
import { WALLET_CATEGORIES } from "@/lib/paylater";
import { cn } from "@/lib/utils";
import { Plus, Repeat, Trash2 } from "lucide-react";
import type { WalletCategory } from "@/types";

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const GRADIENT_MAP: Record<WalletCategory, string> = {
  cash: "from-amber/10 to-amber/5 border-amber/15",
  bank: "from-green/10 to-green/5 border-green/15",
  ewallet: "from-purple/10 to-purple/5 border-purple/15",
  savings: "from-primary/10 to-primary/5 border-primary/15",
  budget: "from-rose/10 to-rose/5 border-rose/15",
  investment: "from-indigo/10 to-indigo/5 border-indigo/15",
  liability: "from-red/10 to-red/5 border-red/15",
};

export default function WalletsPage() {
  const { data: wallets, isLoading } = useWallets();
  const { user } = useAuth();
  const deleteWallet = useDeleteWallet();

  const grouped = (wallets || []).reduce((acc, w) => {
    const cat = (w.wallet_category || "cash") as WalletCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(w);
    return acc;
  }, {} as Record<WalletCategory, typeof wallets>);

  const totalAssets = (wallets || []).filter((w) => w.wallet_category !== "liability").reduce((s, w) => s + Number(w.balance || 0), 0);
  const totalLiabilities = (wallets || []).filter((w) => w.wallet_category === "liability").reduce((s, w) => s + Number(w.used_limit || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Wallets</h1>
          <p className="text-xs text-muted-foreground">Kelola semua dompet dan rekening</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card border text-sm font-medium text-foreground hover:bg-card transition-all">
            <Repeat className="w-4 h-4" /> Transfer
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Tambah Wallet
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 border stat-card-balance">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Aset</p>
          <p className="text-xl font-bold font-mono text-foreground">{formatRupiahShort(totalAssets)}</p>
        </div>
        <div className="glass-card p-4 border stat-card-expense">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Kewajiban</p>
          <p className="text-xl font-bold font-mono text-red">{formatRupiahShort(totalLiabilities)}</p>
        </div>
        <div className="glass-card p-4 border stat-card-savings">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Net Worth</p>
          <p className={cn("text-xl font-bold font-mono", totalAssets - totalLiabilities >= 0 ? "text-green" : "text-red")}>{formatRupiahShort(totalAssets - totalLiabilities)}</p>
        </div>
      </div>

      {/* Wallet Cards grouped */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
          {Object.entries(grouped).map(([cat, ws]) => {
            const catInfo = WALLET_CATEGORIES[cat as WalletCategory] || { label: cat, icon: "💳", color: "#888" };
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>{catInfo.icon}</span> {catInfo.label}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(ws || []).map((w) => {
                    const isLiability = w.wallet_category === "liability";
                    const utilPct = isLiability && w.total_limit ? Math.round((Number(w.used_limit || 0) / Number(w.total_limit)) * 100) : null;
                    return (
                      <motion.div key={w.id} variants={fadeUp} className={cn("glass-card p-5 bg-gradient-to-br border group", GRADIENT_MAP[w.wallet_category as WalletCategory] || GRADIENT_MAP.cash)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{w.icon}</span>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{w.name}</p>
                              {w.provider && <p className="text-[10px] text-muted-foreground">{w.provider}</p>}
                            </div>
                          </div>
                          <button onClick={() => { if (confirm(`Hapus wallet "${w.name}"?`)) deleteWallet.mutate(w.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-dim text-dim hover:text-red transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xl font-bold font-mono text-foreground mb-1">
                          {isLiability ? formatRupiah(Number(w.used_limit || 0)) : formatRupiah(w.balance)}
                        </p>

                        {isLiability && w.total_limit ? (
                          <div className="mt-3">
                            <div className="flex justify-between text-[10px] text-muted-foreground font-mono mb-1">
                              <span>Terpakai {utilPct}%</span>
                              <span>Limit {formatRupiahShort(Number(w.total_limit))}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-card overflow-hidden">
                              <div className={cn("h-full rounded-full transition-all", (utilPct || 0) > 80 ? "bg-red" : (utilPct || 0) > 50 ? "bg-amber" : "bg-green")} style={{ width: `${Math.min(100, utilPct || 0)}%` }} />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {catInfo.label}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
