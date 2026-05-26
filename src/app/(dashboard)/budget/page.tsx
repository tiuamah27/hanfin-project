"use client";

import { motion } from "framer-motion";
import { useBudgets, useCategories, useTransactions } from "@/hooks";
import { useFilterStore } from "@/stores/filter-store";
import { formatRupiahShort, getMonthString, todayISO, formatDateShort } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, PieChart } from "lucide-react";
import { useMemo } from "react";

export default function BudgetPage() {
  const { budgetPeriod, setBudgetPeriod } = useFilterStore();
  const { data: budgets, isLoading } = useBudgets(budgetPeriod);
  const { data: txns } = useTransactions(budgetPeriod);
  const today = todayISO();

  const changePeriod = (d: number) => {
    const [y, m] = budgetPeriod.split("-").map(Number);
    const dt = new Date(y, m - 1 + d, 1);
    setBudgetPeriod(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  };

  const periodLabel = (() => {
    const [y, m] = budgetPeriod.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(y, m - 1));
  })();

  const spending = useMemo(() => {
    const map: Record<string, number> = {};
    (txns || []).filter((t) => t.type === "expense").forEach((t) => {
      if (t.category_id) map[t.category_id] = (map[t.category_id] || 0) + Number(t.amount);
    });
    return map;
  }, [txns]);

  const totalBudget = (budgets || []).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalTerpakai = Object.values(spending).reduce((sum, val) => sum + Number(val || 0), 0);
  const budgetTerpakaiPct = totalBudget > 0 ? (totalTerpakai / totalBudget) * 100 : 0;
  const sisaBudget = Math.max(0, totalBudget - totalTerpakai);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-6">
      
      {/* Left Content (Main Content) */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex-none h-[44px] mb-6">
          <div className="flex h-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-bold text-foreground leading-none mb-1.5">Budget</h1>
              <p className="text-xs text-muted-foreground leading-none">Anggaran per kategori</p>
            </div>
            {/* Period Nav */}
            <div className="flex items-center gap-2 bg-[#1a2235] backdrop-blur-md rounded-full p-1 border border-border/50 shadow-sm">
              <button onClick={() => changePeriod(-1)} className="p-1.5 rounded-full hover:bg-card text-muted-foreground transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-medium text-foreground w-28 text-center font-mono">{periodLabel}</span>
              <button onClick={() => changePeriod(1)} className="p-1.5 rounded-full hover:bg-card text-muted-foreground transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <div className="space-y-6">

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-[100px] border border-border/50 bg-[#0a0f1c]/50">
          <PieChart className="w-12 h-12 text-[#38bdf8] mx-auto mb-4 opacity-80" />
          <p className="text-sm font-bold text-foreground">Belum ada budget</p>
          <p className="text-xs text-muted-foreground mt-1">Set anggaran untuk mengontrol pengeluaran</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const catId = b.category_id || "";
            const actual = spending[catId] || 0;
            const pct = b.amount > 0 ? Math.round((actual / b.amount) * 100) : 0;
            const catName = b.categories?.name || b.budget_groups?.name || "Umum";
            const catIcon = b.categories?.icon || b.budget_groups?.icon || "📊";
            return (
              <div key={b.id} className="glass-card p-5 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{catIcon}</span>
                  <span className="text-sm font-medium text-foreground">{catName}</span>
                  <span className={cn("ml-auto text-xs font-bold font-mono", pct > 100 ? "text-red" : pct > 80 ? "text-amber" : "text-green")}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-card overflow-hidden mb-2">
                  <div className={cn("h-full rounded-full transition-all duration-700", pct > 100 ? "bg-red" : pct > 80 ? "bg-amber" : "bg-green")} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>{formatRupiahShort(actual)} terpakai</span>
                  <span>{formatRupiahShort(b.amount)} budget</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
      </div>

      {/* Right Content (Analytics Panel) */}
      <div className="w-full xl:w-[320px] shrink-0">
        {/* Quick Actions */}
        <div className="w-full h-[44px] mb-6">
          <button className="w-full h-full flex items-center justify-center gap-2 rounded-xl gradient-accent text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Set Budget
          </button>
        </div>
        
        {/* Ringkasan Anggaran */}
        <div className="glass-card p-6 mb-4 border border-border/50 bg-gradient-to-b from-card to-background">
           <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-5">Ringkasan Anggaran</h3>
           
           <div className="mb-4">
             <div className="flex justify-between text-xs mb-2">
               <span className="text-muted-foreground">Budget Terpakai</span>
               <span className={cn("font-mono font-bold", budgetTerpakaiPct > 100 ? "text-red" : budgetTerpakaiPct > 80 ? "text-amber" : "text-green")}>{budgetTerpakaiPct.toFixed(1)}%</span>
             </div>
             <div className="h-1.5 rounded-full bg-card overflow-hidden">
               <div className={cn("h-full transition-all duration-1000", budgetTerpakaiPct > 100 ? "bg-red shadow-[0_0_10px_rgba(244,63,94,0.5)]" : budgetTerpakaiPct > 80 ? "bg-amber shadow-[0_0_10px_rgba(251,191,36,0.5)]" : "bg-green shadow-[0_0_10px_rgba(34,197,94,0.5)]")} style={{ width: `${Math.min(budgetTerpakaiPct, 100)}%` }} />
             </div>
           </div>

           <div className="space-y-3">
             <div className="flex items-center justify-between px-4 py-2.5 rounded-full border border-border/50">
                <div className="text-xs text-muted-foreground">Total Budget</div>
                <div className="text-sm font-bold font-mono text-foreground">
                   {formatRupiahShort(totalBudget)}
                </div>
             </div>
             <div className="flex items-center justify-between px-4 py-2.5 rounded-full border border-border/50">
                <div className="text-xs text-muted-foreground">Total Terpakai</div>
                <div className="text-sm font-bold font-mono text-foreground">
                   {formatRupiahShort(totalTerpakai)}
                </div>
             </div>
             <div className="flex items-center justify-between px-4 py-2.5 rounded-full border border-border/50">
                <div className="text-xs text-muted-foreground">Sisa Budget</div>
                <div className="text-sm font-bold font-mono text-green">
                   {formatRupiahShort(sisaBudget)}
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
             {(txns || []).slice(0, 6).map(t => (
               <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    <span className="text-sm">{t.categories?.icon || "💸"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.description || t.categories?.name || "Transaksi"}</p>
                    <p className="text-[9px] text-muted-foreground">{formatDateShort(t.date)}</p>
                  </div>
                  <div className={cn("text-[11px] font-mono font-bold whitespace-nowrap", t.type === "income" ? "text-green" : "text-red")}>
                    {t.type === "income" ? "+" : "-"}{formatRupiahShort(t.amount)}
                  </div>
               </div>
             ))}
             {(!txns || txns.length === 0) && (
               <div className="text-center py-4">
                 <p className="text-xs text-muted-foreground">Belum ada transaksi</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </motion.div>
  );
}
