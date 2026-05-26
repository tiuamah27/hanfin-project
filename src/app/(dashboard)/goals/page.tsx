"use client";

import { motion } from "framer-motion";
import { useGoals, useAuth, useTransactions } from "@/hooks";
import { formatRupiah, formatRupiahShort, formatDate, formatDateShort, todayISO } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { Plus, Target } from "lucide-react";

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const today = todayISO();
  const { data: txns } = useTransactions(today.substring(0, 7));

  const totalTerkumpul = (goals || []).reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = (goals || []).reduce((sum, g) => sum + g.target_amount, 0);
  const totalProgress = totalTarget > 0 ? (totalTerkumpul / totalTarget) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex-none h-[44px] mb-6">
          <div className="flex h-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-bold text-foreground leading-none mb-1.5">Goals</h1>
              <p className="text-xs text-muted-foreground leading-none">Target keuangan keluarga</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-48 skeleton rounded-2xl" />)}
            </div>
          ) : !goals || goals.length === 0 ? (
            <div className="glass-card py-16 text-center">
              <Target className="w-10 h-10 text-primary mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada goal</p>
              <p className="text-xs text-dim mt-1">Mulai buat target keuangan pertamamu</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((g, i) => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                const remaining = Math.max(0, g.target_amount - g.current_amount);
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 border border-border hover:border-border-bright transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1a2235] border border-border flex items-center justify-center shrink-0">
                            <span className="text-lg">{g.icon || "🎯"}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground leading-tight">{g.name}</p>
                            {g.deadline && <p className="text-[9px] text-muted-foreground font-mono mt-1">Target: {formatDate(g.deadline)}</p>}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold font-mono text-foreground">{pct}%</span>
                      </div>

                      <div className="h-1 rounded-full bg-card overflow-hidden mb-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-amber-500" />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground font-mono">{formatRupiahShort(g.current_amount)}</span>
                          <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Terkumpul</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-foreground font-mono">{formatRupiahShort(g.target_amount)}</span>
                          <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Target</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                      <p className="text-[9px] text-muted-foreground font-mono">Sisa: {formatRupiah(remaining)}</p>
                      <button className="px-4 py-1.5 rounded-full gradient-accent text-white text-[10px] font-bold shadow-sm shadow-primary/20 hover:opacity-90 transition-all">
                        + Nabung
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="w-full xl:w-[320px] shrink-0">
        <div className="w-full h-[44px] mb-6">
          <button className="w-full h-full flex items-center justify-center gap-2 rounded-xl gradient-accent text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Buat Goal Baru
          </button>
        </div>
        
        <div className="glass-card p-5 mb-4 border border-border/50 bg-gradient-to-b from-card to-background">
           <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-5">Ringkasan Goals</h3>
           
           <div className="mb-4">
             <div className="flex justify-between text-xs mb-2">
               <span className="text-muted-foreground">Progress Keseluruhan</span>
               <span className="font-mono font-bold text-primary">{totalProgress.toFixed(1)}%</span>
             </div>
             <div className="h-1.5 rounded-full bg-card overflow-hidden">
               <div className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(56,189,248,0.5)]" style={{ width: `${Math.min(totalProgress, 100)}%` }} />
             </div>
           </div>

           <div className="h-px w-full bg-border/50 my-4" />

           <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Total Terkumpul</div>
              <div className="text-sm font-bold font-mono text-green">
                 {formatRupiahShort(totalTerkumpul)}
              </div>
           </div>

           <div className="h-px w-full bg-border/50 my-4" />

           <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-muted-foreground">Total Target</div>
              <div className="text-sm font-bold font-mono text-foreground">
                 {formatRupiahShort(totalTarget)}
              </div>
           </div>
        </div>

        <div className="glass-card p-5 mb-4 border border-border/50">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaksi Terbaru</h3>
              <span className="text-[10px] text-primary cursor-pointer hover:underline">Lihat Semua →</span>
           </div>
             <div className="space-y-3">
               {(txns || []).filter(t => {
                 const txt = ((t.categories?.name || "") + " " + (t.description || "") + " " + (t.notes || "")).toLowerCase();
                 return txt.includes('goal') || txt.includes('tabung') || t.category_id === 'goals';
               }).slice(0, 6).map(t => (
                 <div key={t.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                      <span className="text-sm">{t.categories?.icon || "🎯"}</span>
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
               {(!txns || txns.filter(t => {
                 const txt = ((t.categories?.name || "") + " " + (t.description || "") + " " + (t.notes || "")).toLowerCase();
                 return txt.includes('goal') || txt.includes('tabung') || t.category_id === 'goals';
               }).length === 0) && (
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
