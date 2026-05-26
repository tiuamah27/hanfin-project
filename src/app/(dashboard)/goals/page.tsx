"use client";

import { motion } from "framer-motion";
import { useGoals, useAuth } from "@/hooks";
import { formatRupiah, formatRupiahShort, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { Plus, Target } from "lucide-react";

const COLORS = ["bg-primary", "bg-purple", "bg-amber", "bg-green", "bg-rose", "bg-cyan"];

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Goals</h1>
          <p className="text-xs text-muted-foreground">Target keuangan keluarga</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Buat Goal
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : !goals || goals.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <Target className="w-10 h-10 text-primary mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-muted-foreground">Belum ada goal</p>
          <p className="text-xs text-dim mt-1">Mulai buat target keuangan pertamamu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g, i) => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
            const remaining = Math.max(0, g.target_amount - g.current_amount);
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 border border-border hover:border-border-bright transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{g.name}</p>
                      {g.deadline && <p className="text-[10px] text-muted-foreground font-mono">{formatDate(g.deadline)}</p>}
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-primary">{pct}%</span>
                </div>

                {/* Progress */}
                <div className="h-2 rounded-full bg-card overflow-hidden mb-3">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className={cn("h-full rounded-full", COLORS[i % COLORS.length])} />
                </div>

                <div className="flex justify-between text-[11px] font-mono mb-4">
                  <span className="text-green">{formatRupiahShort(g.current_amount)}</span>
                  <span className="text-muted-foreground">{formatRupiahShort(g.target_amount)}</span>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground mb-2">Sisa: {formatRupiah(remaining)}</p>
                  <button className="w-full py-2 rounded-lg bg-primary-dim text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
                    + Kontribusi
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
