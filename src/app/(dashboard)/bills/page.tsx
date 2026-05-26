"use client";

import { motion } from "framer-motion";
import { useBills, usePayLaterBills, usePayBill } from "@/hooks";
import { useFilterStore } from "@/stores/filter-store";
import { formatRupiah, formatDateShort, todayISO } from "@/lib/utils/formatters";
import { getProviderInfo } from "@/lib/paylater";
import { cn } from "@/lib/utils";
import { Plus, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default function BillsPage() {
  const { billsStatus, setBillsStatus } = useFilterStore();
  const { data: bills, isLoading: billsLoading } = useBills(billsStatus === "all" ? undefined : billsStatus);
  const { data: plBills, isLoading: plLoading } = usePayLaterBills();
  const payBill = usePayBill();
  const today = todayISO();

  const tabs = [
    { key: "all", label: "Semua" },
    { key: "unpaid", label: "Belum Bayar" },
    { key: "paid", label: "Lunas" },
    { key: "overdue", label: "Terlambat" },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Tagihan</h1>
          <p className="text-xs text-muted-foreground">Tagihan reguler & cicilan PayLater</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-accent text-white text-sm font-semibold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Tambah Tagihan
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setBillsStatus(t.key)} className={cn("px-4 py-2 rounded-lg text-xs font-medium transition-all", billsStatus === t.key ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Regular Bills */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">📋 Tagihan Reguler</h3>
        {billsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
          </div>
        ) : !bills || bills.length === 0 ? (
          <div className="glass-card py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-green mx-auto mb-2 opacity-60" />
            <p className="text-sm text-muted-foreground">Tidak ada tagihan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bills.map((b) => {
              const isOverdue = b.status === "overdue" || (b.status === "unpaid" && b.due_date < today);
              const isPaid = b.status === "paid";
              return (
                <div key={b.id} className={cn("glass-card p-5 border transition-all", isOverdue ? "border-red/20" : isPaid ? "border-green/20" : "border-amber/15")}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{b.is_recurring ? `🔄 ${b.recurrence_type}` : "Sekali bayar"}</p>
                    </div>
                    <span className={cn("text-[9px] font-bold font-mono px-2 py-1 rounded-full uppercase", isOverdue ? "bg-red-dim text-red" : isPaid ? "bg-green-dim text-green" : "bg-amber-dim text-amber")}>
                      {isOverdue ? "Overdue" : isPaid ? "Lunas" : "Unpaid"}
                    </span>
                  </div>
                  <p className="text-lg font-bold font-mono text-foreground">{formatRupiah(b.amount)}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                    {isOverdue ? <AlertTriangle className="w-3 h-3 text-red" /> : <Clock className="w-3 h-3" />}
                    <span>{formatDateShort(b.due_date)}</span>
                  </div>
                  {!isPaid && (
                    <button onClick={() => payBill.mutate(b.id)} className="mt-3 w-full py-2 rounded-lg bg-green-dim text-green text-xs font-semibold hover:bg-green/20 transition-colors">
                      Tandai Lunas
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PayLater Bills */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">💳 Cicilan PayLater</h3>
        {plLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
        ) : !plBills || plBills.length === 0 ? (
          <div className="glass-card py-8 text-center"><p className="text-sm text-muted-foreground">Tidak ada cicilan PayLater</p></div>
        ) : (
          <div className="glass-card overflow-hidden divide-y divide-border/50">
            {plBills.map((b) => {
              const prov = getProviderInfo(b.provider);
              const remaining = Number(b.remaining_amount || (b.amount - (b.paid_amount || 0)));
              const isPaid = b.status === "paid";
              const isOverdue = !isPaid && b.due_date < today;
              return (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4 hover:bg-card/50 transition-colors">
                  <span className="text-xl">{prov.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{b.wallets?.name || prov.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">Jatuh tempo: {formatDateShort(b.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-sm font-mono font-bold", isPaid ? "text-green" : isOverdue ? "text-red" : "text-amber")}>{formatRupiah(remaining)}</p>
                    <span className={cn("text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full", isPaid ? "bg-green-dim text-green" : isOverdue ? "bg-red-dim text-red" : "bg-amber-dim text-amber")}>
                      {isPaid ? "LUNAS" : isOverdue ? "OVERDUE" : b.status === "partial" ? "PARTIAL" : "UNPAID"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
