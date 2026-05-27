"use client";

import { motion } from "framer-motion";
import { useWallets, useAuth, useDeleteWallet, useTransactions } from "@/hooks";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { formatRupiah, formatRupiahShort, formatDateShort } from "@/lib/utils/formatters";
import { WALLET_CATEGORIES } from "@/lib/paylater";
import { cn } from "@/lib/utils";
import { Plus, Repeat, Trash2, Edit2 } from "lucide-react";
import type { WalletCategory } from "@/types";
import { toast } from "@/components/ui/toaster";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useState } from "react";
import { useUIStore } from "@/stores/ui-store";

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const GRADIENT_MAP: Record<WalletCategory, string> = {
  cash: "from-amber/20 to-amber/5 border-amber/30",
  bank: "from-green/20 to-green/5 border-green/30",
  ewallet: "from-purple/20 to-purple/5 border-purple/30",
  savings: "from-primary/20 to-primary/5 border-primary/30",
  budget: "from-rose/20 to-rose/5 border-rose/30",
  investment: "from-indigo/20 to-indigo/5 border-indigo/30",
  liability: "from-red/20 to-red/5 border-red/30",
};

// Generate actual historical daily balance data for the sparkline
const generateWalletSparkline = (wallet: any, txns: any[], daysInMonth: number) => {
  const isLiability = wallet.wallet_category === 'liability';
  const walletTxns = (txns || []).filter(t => t.wallet_id === wallet.id);

  let monthNetFlow = 0;
  const dailyFlow: Record<number, number> = {};

  walletTxns.forEach(t => {
    if (!t.date) return;
    const day = parseInt(t.date.split('-')[2], 10);
    if (!dailyFlow[day]) dailyFlow[day] = 0;

    let amount = Number(t.amount);
    if (isLiability) {
      if (t.type === 'expense') { monthNetFlow += amount; dailyFlow[day] += amount; }
      else if (t.type === 'income') { monthNetFlow -= amount; dailyFlow[day] -= amount; }
    } else {
      if (t.type === 'income') { monthNetFlow += amount; dailyFlow[day] += amount; }
      else if (t.type === 'expense') { monthNetFlow -= amount; dailyFlow[day] -= amount; }
    }
  });

  const currentVal = isLiability ? Number(wallet.used_limit || 0) : Number(wallet.balance || 0);
  const startBalance = currentVal - monthNetFlow;

  const data = [];
  let runningBalance = startBalance;
  
  for (let i = 1; i <= daysInMonth; i++) {
    runningBalance += (dailyFlow[i] || 0);
    data.push({ day: i, value: Math.max(0, runningBalance) });
  }

  if (data.length === 0) return [{ value: 0 }, { value: 0 }];
  return data;
};

export default function WalletsPage() {
  const { openModal } = useUIStore();
  const { data: wallets, isLoading } = useWallets();
  const { user } = useAuth();
  const deleteWallet = useDeleteWallet();
  const [walletToDelete, setWalletToDelete] = useState<{ id: string, name: string } | null>(null);

  const grouped = (wallets || []).reduce((acc, w) => {
    const cat = (w.wallet_category || "cash") as WalletCategory;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(w);
    return acc;
  }, {} as Record<WalletCategory, typeof wallets>);

  const totalAssets = (wallets || []).filter((w) => w.wallet_category !== "liability").reduce((s, w) => s + Number(w.balance || 0), 0);
  const liquidCash = (wallets || []).filter(w => ["cash", "bank", "ewallet"].includes(w.wallet_category)).reduce((s, w) => s + Number(w.balance || 0), 0);
  const savings = (wallets || []).filter(w => ["savings", "investment", "budget"].includes(w.wallet_category)).reduce((s, w) => s + Number(w.balance || 0), 0);
  const totalLiabilities = (wallets || []).filter((w) => w.wallet_category === "liability").reduce((s, w) => s + Number(w.used_limit || 0), 0);

  // Financial Health Metrics
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const { data: txns } = useTransactions(currentMonthStr);
  
  const income = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const cashflow = income - expense;
  const expenseRatio = income > 0 ? (expense / income) * 100 : 0;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  const avgMonthlySpending = expense / currentDay * daysInMonth;
  const savingsRate = income > 0 ? (Math.max(0, cashflow) / income) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left Content (Wallets Grid) */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex-none h-auto sm:h-[44px] mb-6">
            <div className="flex h-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col justify-center">
                <h1 className="text-lg font-bold text-foreground leading-none mb-1.5">Wallets</h1>
                <p className="text-xs text-muted-foreground leading-none">Kelola semua dompet dan rekening</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">


      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
          <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1 relative z-10">Total Assets</p>
          <p className="text-xl font-bold font-mono text-foreground relative z-10">{formatRupiahShort(totalAssets)}</p>
          <p className="text-[10px] text-muted-foreground mt-1 relative z-10">{wallets?.filter(w => w.wallet_category !== 'liability').length || 0} wallet aktif</p>
        </div>
        <div className="glass-card p-4 bg-gradient-to-br from-red/10 to-red/5 border border-red/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-red/10 rounded-full blur-xl"></div>
          <p className="text-[10px] font-medium text-red uppercase tracking-wider mb-1 relative z-10">Total Liability</p>
          <p className="text-xl font-bold font-mono text-foreground relative z-10">{formatRupiahShort(totalLiabilities)}</p>
          <p className="text-[10px] text-muted-foreground mt-1 relative z-10">Tagihan berjalan</p>
        </div>
      </div>

      {/* Wallet Cards grouped */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-4">
            {(['cash', 'ewallet', 'savings'] as WalletCategory[]).map((cat) => {
              const ws = grouped[cat];
              if (!ws || ws.length === 0) return null;
              const catInfo = WALLET_CATEGORIES[cat as WalletCategory] || { label: cat, icon: "💳", color: "#888" };
              return (
                <div key={cat} className="flex flex-col w-full">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-sm", 
                      cat === 'bank' ? "bg-slate-400" :
                      cat === 'liability' ? "w-0 h-0 rounded-none border-l-[5px] border-r-[5px] border-b-[8px] border-transparent border-b-amber-500" :
                      cat === 'cash' ? "bg-green-500" :
                      cat === 'savings' ? "bg-blue-500" :
                      cat === 'ewallet' ? "bg-purple-500" : "bg-primary")} 
                    />
                    {catInfo.label}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {ws.map((w) => {
                      const isLiability = w.wallet_category === "liability";
                      const isCreditCard = w.type === "credit_card";
                      const limit = w.total_limit || 0;
                      const used = w.used_limit || 0;
                      const available = limit - used;
                      const usagePercent = limit > 0 ? (used / limit) * 100 : 0;
                      
                      return (
                        <motion.div variants={fadeUp} key={w.id} className={cn("glass-card p-4 bg-gradient-to-br relative overflow-hidden group hover:shadow-lg transition-all", GRADIENT_MAP[w.wallet_category as WalletCategory] || "border-border")}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-lg">{w.icon}</span>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{w.name}</h4>
                                <p className="text-[10px] text-muted-foreground capitalize">{w.type?.replace("_", " ") || "Wallet"}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                              <button onClick={() => openModal("wallet", w)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-primary transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setWalletToDelete({ id: w.id, name: w.name })} className="p-1.5 rounded-lg hover:bg-red-dim text-muted-foreground hover:text-red transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="relative z-10">
                          {isLiability ? (
                            <div className="space-y-3">
                              <div className="flex items-end justify-between">
                                <div>
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Tagihan Berjalan</p>
                                  <p className="text-lg font-bold font-mono text-red">{formatRupiah(used)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Tersedia</p>
                                  <p className="text-sm font-bold font-mono text-foreground">{formatRupiah(available)}</p>
                                </div>
                              </div>
                              {isCreditCard && limit > 0 && (
                                <div className="space-y-1.5">
                                  <div className="h-1.5 rounded-full bg-card overflow-hidden">
                                    <div className="h-full bg-red transition-all duration-500" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                                  </div>
                                  <div className="flex justify-between text-[9px] text-muted-foreground">
                                    <span>{usagePercent.toFixed(1)}% Terpakai</span>
                                    <span>Limit {formatRupiahShort(limit)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">Saldo Aktif</p>
                              <p className="text-lg font-bold font-mono text-foreground">{formatRupiah(w.balance || 0)}</p>
                            </div>
                          )}
                          </div>

                          {/* Sparkline Chart */}
                          <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 pointer-events-none">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                              <AreaChart data={generateWalletSparkline(w, txns || [], daysInMonth)}>
                                <defs>
                                  <linearGradient id={`spark-${w.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isLiability ? "#ef4444" : "#6366f1"} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={isLiability ? "#ef4444" : "#6366f1"} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke={isLiability ? "#ef4444" : "#6366f1"} fill={`url(#spark-${w.id})`} strokeWidth={2} isAnimationActive={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4">
            {(['bank', 'liability'] as WalletCategory[]).map((cat) => {
              const ws = grouped[cat];
              if (!ws || ws.length === 0) return null;
              const catInfo = WALLET_CATEGORIES[cat as WalletCategory] || { label: cat, icon: "💳", color: "#888" };
              return (
                <div key={cat} className="flex flex-col w-full">
                  <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-sm", 
                      cat === 'bank' ? "bg-slate-400" :
                      cat === 'liability' ? "w-0 h-0 rounded-none border-l-[5px] border-r-[5px] border-b-[8px] border-transparent border-b-amber-500" :
                      cat === 'cash' ? "bg-green-500" :
                      cat === 'savings' ? "bg-blue-500" :
                      cat === 'ewallet' ? "bg-purple-500" : "bg-primary")} 
                    />
                    {catInfo.label}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {ws.map((w) => {
                      const isLiability = w.wallet_category === "liability";
                      const isCreditCard = w.type === "credit_card";
                      const limit = w.total_limit || 0;
                      const used = w.used_limit || 0;
                      const available = limit - used;
                      const usagePercent = limit > 0 ? (used / limit) * 100 : 0;
                      
                      return (
                        <motion.div variants={fadeUp} key={w.id} className={cn("glass-card p-4 bg-gradient-to-br relative overflow-hidden group hover:shadow-lg transition-all", GRADIENT_MAP[w.wallet_category as WalletCategory] || "border-border")}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 relative z-10">
                              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-sm">
                                <span className="text-lg">{w.icon}</span>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{w.name}</h4>
                                <p className="text-[10px] text-muted-foreground capitalize">{w.type?.replace("_", " ") || "Wallet"}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                              <button onClick={() => openModal("wallet", w)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground hover:text-primary transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setWalletToDelete({ id: w.id, name: w.name })} className="p-1.5 rounded-lg hover:bg-red-dim text-muted-foreground hover:text-red transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="relative z-10">
                          {isLiability ? (
                            <div className="space-y-3">
                              <div className="flex items-end justify-between">
                                <div>
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Tagihan Berjalan</p>
                                  <p className="text-lg font-bold font-mono text-red">{formatRupiah(used)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-muted-foreground mb-0.5">Tersedia</p>
                                  <p className="text-sm font-bold font-mono text-foreground">{formatRupiah(available)}</p>
                                </div>
                              </div>
                              {isCreditCard && limit > 0 && (
                                <div className="space-y-1.5">
                                  <div className="h-1.5 rounded-full bg-card overflow-hidden">
                                    <div className="h-full bg-red transition-all duration-500" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
                                  </div>
                                  <div className="flex justify-between text-[9px] text-muted-foreground">
                                    <span>{usagePercent.toFixed(1)}% Terpakai</span>
                                    <span>Limit {formatRupiahShort(limit)}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">Saldo Aktif</p>
                              <p className="text-lg font-bold font-mono text-foreground">{formatRupiah(w.balance || 0)}</p>
                            </div>
                          )}
                          </div>

                          {/* Sparkline Chart */}
                          <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 pointer-events-none">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                              <AreaChart data={generateWalletSparkline(w, txns || [], daysInMonth)}>
                                <defs>
                                  <linearGradient id={`spark-${w.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isLiability ? "#ef4444" : "#6366f1"} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={isLiability ? "#ef4444" : "#6366f1"} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke={isLiability ? "#ef4444" : "#6366f1"} fill={`url(#spark-${w.id})`} strokeWidth={2} isAnimationActive={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      </div>
      </div>

      {/* Right Content (Analytics Panel) */}
      <div className="w-full xl:w-[320px] shrink-0">
        {/* Quick Actions */}
        <div className="flex gap-3 w-full h-auto sm:h-[44px] mb-6">
          <button onClick={() => openModal("transfer")} className="flex-1 h-full flex items-center justify-center gap-2 py-3 sm:py-0 rounded-xl glass-card border border-border text-sm font-medium text-foreground hover:bg-card transition-all shadow-sm">
            <Repeat className="w-4 h-4" /> Transfer
          </button>
          <button onClick={() => openModal("wallet")} className="flex-1 h-full flex items-center justify-center gap-2 py-3 sm:py-0 rounded-xl gradient-accent text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Tambah Wallet
          </button>
        </div>
        
        {/* Asset Distribution */}
        <div className="glass-card p-5 mb-4 border border-border/50">
           <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Distribusi Aset</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <span className="text-muted-foreground">Liquid Cash</span>
                </div>
                <span className="font-mono font-bold text-foreground">{formatRupiahShort(liquidCash)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-card overflow-hidden">
                <div className="h-full bg-green transition-all duration-1000" style={{ width: `${totalAssets > 0 ? (liquidCash/totalAssets)*100 : 0}%` }} />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple" />
                  <span className="text-muted-foreground">Savings & Invest</span>
                </div>
                <span className="font-mono font-bold text-foreground">{formatRupiahShort(savings)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-card overflow-hidden">
                <div className="h-full bg-purple transition-all duration-1000" style={{ width: `${totalAssets > 0 ? (savings/totalAssets)*100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="glass-card p-5 mb-4 border border-border/50">
           <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ringkasan Kesehatan</h3>
           <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                 <div className="text-xs text-muted-foreground">Cashflow Net</div>
                 <div className={cn("text-sm font-bold font-mono", cashflow >= 0 ? "text-primary" : "text-red")}>
                    {cashflow > 0 ? "+" : ""}{formatRupiahShort(cashflow)}
                 </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                 <div className="text-xs text-muted-foreground">Rasio Pengeluaran</div>
                 <div className={cn("text-sm font-bold font-mono", expenseRatio > 80 ? "text-red" : expenseRatio > 50 ? "text-amber" : "text-primary")}>
                    {expenseRatio.toFixed(1)}%
                 </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                 <div className="text-xs text-muted-foreground">Savings Rate</div>
                 <div className="text-sm font-bold font-mono text-foreground">
                    {savingsRate.toFixed(1)}%
                 </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                 <div className="text-xs text-muted-foreground">Est. Biaya Bulanan</div>
                 <div className="text-sm font-bold font-mono text-muted-foreground">
                    {formatRupiahShort(avgMonthlySpending)}
                 </div>
              </div>
               <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                 <div className="text-xs text-muted-foreground">Rasio Utang (Utang/Aset)</div>
                 <div className="text-sm font-bold font-mono text-foreground">
                    {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}%
                 </div>
              </div>
           </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-5 mb-4 border border-border/50">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaksi Terbaru</h3>
              <span className="text-[10px] text-primary cursor-pointer hover:underline">Lihat Semua →</span>
           </div>
           <div className="space-y-3">
             {(txns || []).filter(t => t.is_transfer || t.wallets).slice(0, 6).map(t => {
               const flowText = t.description?.includes("->") || t.description?.includes("→") ? t.description : (t.wallets?.name || "Wallet");
               return (
               <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    <span className="text-sm">{t.wallets?.icon || "💳"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{flowText}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDateShort(t.date)}</p>
                  </div>
                  <div className={cn("text-[11px] font-mono font-bold whitespace-nowrap", t.type === "income" ? "text-green" : "text-red")}>
                    {t.type === "income" ? "+" : "-"}{formatRupiahShort(t.amount)}
                  </div>
               </div>
               );
             })}
             {(!txns || txns.filter(t => t.is_transfer || t.wallets).length === 0) && (
               <div className="text-center py-4">
                 <p className="text-xs text-muted-foreground">Belum ada transaksi</p>
               </div>
             )}
           </div>
        </div>
      </div>
      </div>

      <ConfirmModal
        isOpen={!!walletToDelete}
        title="Hapus Wallet"
        message={`Apakah Anda yakin ingin menghapus wallet "${walletToDelete?.name}"?`}
        onConfirm={() => { if (walletToDelete) deleteWallet.mutate(walletToDelete.id); }}
        onCancel={() => setWalletToDelete(null)}
      />
    </motion.div>
  );
}
