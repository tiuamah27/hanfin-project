"use client";

import { motion } from "framer-motion";
import { useTransactions, useCategories, useWallets, useAuth, useCreateTransaction, useDeleteTransaction } from "@/hooks";
import { useFilterStore } from "@/stores/filter-store";
import { formatRupiahShort, formatDateShort, formatRupiah, getMonthString } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { Plus, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";

const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export default function TransactionsPage() {
  const { transactionMonth, setTransactionMonth, transactionType, setTransactionType, transactionSearch, setTransactionSearch } = useFilterStore();
  const { data: txns, isLoading } = useTransactions(transactionMonth, { type: transactionType === "all" ? undefined : transactionType, search: transactionSearch || undefined });
  const { data: categories } = useCategories();
  const { data: wallets } = useWallets();
  const { user } = useAuth();
  const deleteTxn = useDeleteTransaction();
  const [showForm, setShowForm] = useState(false);

  const summary = useMemo(() => {
    if (!txns) return { income: 0, expense: 0 };
    const income = txns.filter((t) => t.type === "income" && !TRANSFER_CATS.includes(t.categories?.name || "")).reduce((s, t) => s + Number(t.amount), 0);
    const expense = txns.filter((t) => t.type === "expense" && !TRANSFER_CATS.includes(t.categories?.name || "")).reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense };
  }, [txns]);

  const changeMonth = (delta: number) => {
    const [y, m] = transactionMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setTransactionMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  const monthLabel = (() => {
    const [y, m] = transactionMonth.split("-").map(Number);
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(y, m - 1));
  })();

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Transaksi</h1>
          <p className="text-xs text-muted-foreground">Kelola semua transaksi keuangan keluarga</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 items-center">
        {/* Month Nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-foreground w-40 text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-1 bg-card rounded-xl p-1">
          {(["all", "income", "expense"] as const).map((t) => (
            <button key={t} onClick={() => setTransactionType(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", transactionType === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
              {t === "all" ? "Semua" : t === "income" ? "Masuk" : "Keluar"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="text" value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)} placeholder="Cari transaksi..." className="bg-transparent text-sm text-foreground placeholder:text-dim focus:outline-none w-full" />
        </div>

        {/* Summary */}
        <div className="flex gap-4 text-xs font-mono ml-auto">
          <span className="text-green">+{formatRupiahShort(summary.income)}</span>
          <span className="text-red">-{formatRupiahShort(summary.expense)}</span>
          <span className={cn(summary.income - summary.expense >= 0 ? "text-primary" : "text-red")}>
            Net: {formatRupiahShort(summary.income - summary.expense)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 skeleton rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 skeleton" />
                  <div className="h-2.5 w-24 skeleton" />
                </div>
                <div className="h-4 w-20 skeleton" />
              </div>
            ))}
          </div>
        ) : !txns || txns.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-medium text-muted-foreground">Tidak ada transaksi</p>
            <p className="text-xs text-dim mt-1">Coba ubah filter atau tambah transaksi baru</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-card/50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-lg shrink-0">
                  {t.categories?.icon || "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.description || t.categories?.name || "Transaksi"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                    <span>{formatDateShort(t.date)}</span>
                    {t.categories?.name && <span className="px-1.5 py-0.5 rounded bg-card text-dim">{t.categories.name}</span>}
                    {t.profiles?.name && <span>· {t.profiles.name}</span>}
                    {t.is_split && <span className="text-purple">· Split</span>}
                    {t.installment_total_month > 1 && <span className="text-amber">· {t.installment_total_month}x cicilan</span>}
                  </div>
                </div>
                <span className={cn("text-sm font-mono font-bold shrink-0", t.type === "income" ? "text-green" : "text-red")}>
                  {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                </span>
                <button onClick={() => { if (confirm("Hapus transaksi ini?")) deleteTxn.mutate(t); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-dim text-dim hover:text-red transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
