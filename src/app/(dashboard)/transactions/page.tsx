"use client";

import { motion } from "framer-motion";
import { useTransactions, useCategories, useWallets, useAuth, useCreateTransaction, useDeleteTransaction } from "@/hooks";
import { useFilterStore } from "@/stores/filter-store";
import { formatRupiahShort, formatDateShort, formatRupiah, formatDate, getMonthString } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { Plus, Search, ChevronLeft, ChevronRight, Trash2, MoreVertical, Edit2 } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "@/components/ui/toaster";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useUIStore } from "@/stores/ui-store";
import type { Transaction } from "@/types";

const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

function TransactionRow({ t, onEdit, onDelete }: { t: Transaction; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="flex flex-col hover:bg-card/30 transition-colors border-b border-border/50 last:border-0 group">
      <div className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-3.5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-lg shrink-0">
          {t.categories?.icon || "📦"}
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <p className="text-sm font-medium text-foreground truncate transition-colors">
            {t.description || t.categories?.name || "Transaksi"}
          </p>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[10px] md:text-[11px] text-muted-foreground font-mono">
            <span className="shrink-0">{formatDateShort(t.date)}</span>
            {t.categories?.name && <span className="px-1.5 py-0.5 rounded bg-card text-dim shrink-0">{t.categories.name}</span>}
            {t.notes && <span className="truncate max-w-[80px] md:max-w-[150px]">· {t.notes}</span>}
            {t.installment_total_month > 1 && <span className="text-amber shrink-0">· {t.installment_total_month}x</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="flex flex-col items-end gap-1 text-right">
            <span className={cn("text-sm font-mono font-bold whitespace-nowrap", t.type === "income" ? "text-green" : "text-red")}>
              {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
            </span>
            {/* Show badge below amount on mobile */}
            <div className="flex md:hidden justify-end">
              {t.is_split ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border bg-purple/10 text-purple border-purple/20">SPLIT</span>
              ) : t.profiles?.name ? (
                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border", t.profiles.name.toLowerCase().includes('rose') ? "bg-rose/10 text-rose border-rose/20" : "bg-primary/10 text-primary border-primary/20")}>{t.profiles.name}</span>
              ) : null}
            </div>
          </div>
          
          <div className="hidden md:flex w-14 justify-start">
            {t.is_split ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border bg-purple/10 text-purple border-purple/20">
                SPLIT
              </span>
            ) : t.profiles?.name ? (
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border",
                  t.profiles.name.toLowerCase().includes('rose')
                    ? "bg-rose/10 text-rose border-rose/20"
                    : "bg-primary/10 text-primary border-primary/20"
                )}
              >
                {t.profiles.name}
              </span>
            ) : null}
          </div>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} 
              className={cn("p-1.5 rounded-lg text-dim hover:text-foreground transition-all hover:bg-surface", menuOpen ? "opacity-100" : "opacity-0 md:group-hover:opacity-100")}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-xl shadow-xl z-10 py-1 overflow-hidden">
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-card transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red hover:bg-red-dim transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {expanded && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-5 pb-4 overflow-hidden text-xs">
          <div className="p-3.5 rounded-xl bg-surface/50 border border-border flex flex-wrap gap-x-8 gap-y-4">
            <div>
              <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Kategori</span>
              <span className="font-medium">{t.categories?.name || "-"}</span>
            </div>
            <div>
              <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Dompet</span>
              <span className="font-medium">{t.wallets?.name || "-"}</span>
            </div>
            <div>
              <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Tanggal Lengkap</span>
              <span className="font-medium font-mono">{formatDate(t.date)}</span>
            </div>
            <div>
              <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Input Oleh</span>
              <span className="font-medium">{t.profiles?.name || "System"}</span>
            </div>
            
            {t.description && (
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Deskripsi Utama</span>
                <span className="font-medium">{t.description}</span>
              </div>
            )}
            
            {t.notes && (
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Catatan Tambahan</span>
                <span className="font-medium">{t.notes}</span>
              </div>
            )}
            
            {t.is_split && (
              <>
                <div className="border-l border-border/50 pl-6">
                  <span className="block text-[9px] text-primary uppercase tracking-wider mb-1">Porsi Saya</span>
                  <span className="font-bold text-primary">{t.split_percentage_payer}%</span>
                </div>
                <div>
                  <span className="block text-[9px] text-rose uppercase tracking-wider mb-1">Porsi Pasangan</span>
                  <span className="font-bold text-rose">{t.split_percentage_other}%</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const { openModal } = useUIStore();
  const { transactionMonth, setTransactionMonth, transactionType, setTransactionType, transactionSearch, setTransactionSearch, transactionCategory, setTransactionCategory } = useFilterStore();
  const { data: txns, isLoading } = useTransactions(transactionMonth, { 
    type: transactionType === "all" ? undefined : transactionType, 
    search: transactionSearch || undefined,
    categoryId: transactionCategory === "all" ? undefined : transactionCategory
  });
  const { data: categories } = useCategories();
  const { data: wallets } = useWallets();
  const { user } = useAuth();
  const deleteTxn = useDeleteTransaction();
  const [showForm, setShowForm] = useState(false);
  const [txnToDelete, setTxnToDelete] = useState<Transaction | null>(null);

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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-7rem)]">
      {/* Page Title */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Transaksi</h1>
          <p className="text-xs text-muted-foreground">Kelola semua transaksi keuangan keluarga</p>
        </div>
        <button onClick={() => openModal("transaction")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Tambah Transaksi
        </button>
      </div>

      {/* Fixed Filters Wrapper */}
      <div className="flex-none mb-5">
        <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center shadow-sm">
        {/* Month Nav */}
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-foreground w-40 text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-card text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {/* Type Filter */}
        <div className="flex gap-1 bg-card rounded-xl p-1 shrink-0">
          {(["all", "income", "expense"] as const).map((t) => (
            <button key={t} onClick={() => setTransactionType(t)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", transactionType === t ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
              {t === "all" ? "Semua" : t === "income" ? "Masuk" : "Keluar"}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="shrink-0">
          <select
            value={transactionCategory || "all"}
            onChange={(e) => setTransactionCategory(e.target.value)}
            className="h-[34px] px-3 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer appearance-none pr-8 relative"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            <option value="all">Semua Kategori</option>
            {(categories || []).map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input type="text" value={transactionSearch} onChange={(e) => setTransactionSearch(e.target.value)} placeholder="Cari transaksi..." className="bg-transparent text-sm text-foreground placeholder:text-dim focus:outline-none w-full" />
        </div>

        {/* Summary */}
        <div className="flex gap-4 text-xs font-mono w-full justify-center sm:w-auto sm:justify-start sm:ml-auto">
          <span className="text-green">+{formatRupiahShort(summary.income)}</span>
          <span className="text-red">-{formatRupiahShort(summary.expense)}</span>
          <span className={cn(summary.income - summary.expense >= 0 ? "text-primary" : "text-red")}>
            Net: {formatRupiahShort(summary.income - summary.expense)}
          </span>
        </div>
      </div>
      </div>

      {/* Table Content (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto glass-scrollbar glass-card rounded-2xl border border-border shadow-sm">
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
              <TransactionRow key={t.id} t={t} onEdit={() => openModal("transaction", t)} onDelete={() => setTxnToDelete(t)} />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!txnToDelete}
        title="Hapus Transaksi"
        message={`Apakah Anda yakin ingin menghapus transaksi "${txnToDelete?.description || txnToDelete?.categories?.name || 'ini'}"?`}
        onConfirm={() => { if (txnToDelete) deleteTxn.mutate(txnToDelete); }}
        onCancel={() => setTxnToDelete(null)}
      />
    </motion.div>
  );
}
