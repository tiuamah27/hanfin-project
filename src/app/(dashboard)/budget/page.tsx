"use client";

import { motion } from "framer-motion";
import { useBudgets, useCategories, useTransactions } from "@/hooks";
import { useFilterStore } from "@/stores/filter-store";
import { formatRupiahShort, getMonthString } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, PieChart } from "lucide-react";
import { useMemo } from "react";

export default function BudgetPage() {
  const { budgetPeriod, setBudgetPeriod } = useFilterStore();
  const { data: budgets, isLoading } = useBudgets(budgetPeriod);
  const { data: txns } = useTransactions(budgetPeriod);

  const changePeriod = (d: number) => {
    const [y, m] = budgetPeriod.split("-").map(Number);
    const dt = new Date(y, m - 1 + d, 1);
    setBudgetPeriod(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  };

  const periodLabel = (() => {
    const [y, m] = budgetPeriod.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(y, m - 1));
  })();

  // Calculate actual spending per category
  const spending = useMemo(() => {
    const map: Record<string, number> = {};
    (txns || []).filter((t) => t.type === "expense").forEach((t) => {
      if (t.category_id) map[t.category_id] = (map[t.category_id] || 0) + Number(t.amount);
    });
    return map;
  }, [txns]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Budget</h1>
          <p className="text-xs text-muted-foreground">Anggaran per kategori</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Set Budget
        </button>
      </div>

      {/* Period Nav */}
      <div className="flex items-center gap-2 justify-center">
        <button onClick={() => changePeriod(-1)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-sm font-medium text-foreground w-40 text-center">{periodLabel}</span>
        <button onClick={() => changePeriod(1)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : !budgets || budgets.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <PieChart className="w-10 h-10 text-primary mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada budget</p>
          <p className="text-xs text-dim mt-1">Set anggaran untuk mengontrol pengeluaran</p>
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
    </motion.div>
  );
}
