"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBills, usePayLaterBills, usePayBill, useTransactions } from "@/hooks";
import { useFilterStore } from "@/stores/filter-store";
import { useUIStore } from "@/stores/ui-store";
import { formatRupiah, formatRupiahShort, formatDateShort, todayISO } from "@/lib/utils/formatters";
import { getProviderInfo } from "@/lib/paylater";
import { cn } from "@/lib/utils";
import { Plus, CheckCircle2, Clock, AlertTriangle, Repeat, Edit2, ChevronDown, ChevronUp } from "lucide-react";

export default function BillsPage() {
  const [expandedPL, setExpandedPL] = useState<string | null>(null);
  const { billsStatus, setBillsStatus } = useFilterStore();
  const { openModal } = useUIStore();
  const { data: bills, isLoading: billsLoading } = useBills(billsStatus === "all" ? undefined : billsStatus);
  const { data: plBills, isLoading: plLoading } = usePayLaterBills({
    statusFilter: billsStatus === "all" ? undefined : billsStatus
  });
  const today = todayISO();
  const { data: txns } = useTransactions(today.substring(0, 7));
  const payBill = usePayBill();

  const tabs = [
    { key: "all", label: "Semua" },
    { key: "unpaid", label: "Belum Bayar" },
    { key: "paid", label: "Lunas" },
    { key: "overdue", label: "Terlambat" },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row gap-6">

      {/* Left Content (Main Content) */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex-none h-auto sm:h-[44px] mb-6">
          <div className="flex h-full flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-bold text-foreground leading-none mb-1.5">Tagihan</h1>
              <p className="text-xs text-muted-foreground leading-none">Tagihan reguler & cicilan PayLater</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-card/80 backdrop-blur-md rounded-full p-1 w-fit border border-border shadow-sm">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setBillsStatus(t.key)} className={cn("px-4 py-1.5 rounded-full text-xs font-medium transition-all", billsStatus === t.key ? "gradient-accent text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {/* Regular Bills */}
          <div>
            <h3 className="h-[20px] text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red/10 flex items-center justify-center">
                <span className="text-[10px]">📋</span>
              </div>
              Tagihan Reguler
            </h3>
            {billsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
              </div>
            ) : !bills || bills.length === 0 ? (
              <div className="glass-card py-12 text-center">
                <CheckCircle2 className="w-8 h-8 text-green mx-auto mb-2 opacity-60" />
                <p className="text-sm text-muted-foreground">Tidak ada tagihan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bills.map((b) => {
                  const isOverdue = b.status === "overdue" || (b.status === "unpaid" && b.due_date < today);
                  const isPaid = b.status === "paid";
                  return (
                    <div 
                      key={b.id} 
                      onClick={() => openModal('bill', b)}
                      className={cn("glass-card p-5 border transition-all cursor-pointer hover:bg-card/50", isOverdue ? "border-red/20" : isPaid ? "border-green/20" : "border-amber/15")}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{b.name}</p>
                          {b.is_recurring && (
                             <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                               <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/20 flex items-center justify-center">
                                  <Repeat className="w-1.5 h-1.5 text-blue-500" />
                               </div>
                               Berulang Tiap Bulan
                             </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                           <span className={cn("text-[9px] font-bold font-mono px-2 py-1 rounded-full uppercase", isOverdue ? "bg-red-dim text-red" : isPaid ? "bg-green-dim text-green" : "bg-amber-dim text-amber")}>
                             {isOverdue ? "Overdue" : isPaid ? "Lunas" : "Unpaid"}
                           </span>
                        </div>
                      </div>
                      <p className="text-lg font-bold font-mono text-foreground">{formatRupiah(b.amount)}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                        {isOverdue ? <AlertTriangle className="w-3 h-3 text-red" /> : <Clock className="w-3 h-3" />}
                        <span>{formatDateShort(b.due_date)}</span>
                      </div>
                      {!isPaid && (
                        <button onClick={(e) => { e.stopPropagation(); openModal('bill_payment', b); }} className="mt-3 w-full py-2 rounded-lg bg-card/80 hover:bg-card border border-border/50 text-primary text-[11px] font-semibold transition-colors">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
                <span className="w-4 h-4 rounded bg-amber-dim flex items-center justify-center text-[10px]">💳</span>
                Cicilan PayLater
              </h2>
            </div>
            {plLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>
            ) : !plBills || plBills.length === 0 ? (
              <div className="glass-card py-8 text-center"><p className="text-sm text-muted-foreground">Tidak ada cicilan PayLater</p></div>
            ) : (
              <div className="glass-card overflow-hidden divide-y divide-border/50">
                {plBills.map((b) => {
                  const prov = getProviderInfo(b.provider);
                  const remaining = Number((b as any).remaining_amount || (b.amount - ((b as any).paid_amount || 0)));
                  const isPaid = b.status === "paid";
                  const isOverdue = !isPaid && b.due_date < today;
                  const isExpanded = expandedPL === b.id;
                  const items = (b as any).paylater_bill_items || [];

                  return (
                    <div key={b.id} className="flex flex-col border-b border-border/50 last:border-0">
                      <div 
                        onClick={() => setExpandedPL(isExpanded ? null : b.id)}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-card/50 transition-colors cursor-pointer"
                      >
                        <span className="text-xl">{prov.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{b.wallets?.name || prov.label}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">Jatuh tempo: {formatDateShort(b.due_date)}</p>
                        </div>
                        <div className="text-right mr-3">
                          <p className={cn("text-sm font-mono font-bold", isPaid ? "text-green" : isOverdue ? "text-red" : "text-amber")}>{formatRupiah(remaining)}</p>
                          <span className={cn("text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full", isPaid ? "bg-green-dim text-green" : isOverdue ? "bg-red-dim text-red" : "bg-amber-dim text-amber")}>
                            {isPaid ? "LUNAS" : isOverdue ? "OVERDUE" : b.status === "partial" ? "PARTIAL" : "UNPAID"}
                          </span>
                        </div>
                        {!isPaid && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); openModal('paylater_payment', b); }}
                            className="px-3 py-1.5 bg-[#69f0ae]/10 text-[#69f0ae] border border-[#69f0ae]/20 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-[#69f0ae] hover:text-black transition-colors mr-2"
                          >
                            Bayar
                          </button>
                        )}
                        <div className="text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-card/30"
                          >
                            <div className="p-4 space-y-3 border-t border-border/50">
                              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Riwayat Transaksi & Cicilan</h4>
                              {items.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">Belum ada detail riwayat.</p>
                              ) : (
                                items.map((item: any) => {
                                  const txn = item.transactions;
                                  return (
                                    <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-surface border border-border/50">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                           <p className="font-medium text-foreground">{txn?.description || 'Transaksi PayLater'} <span className="text-blue-400">(Cicilan {item.installment_number}/{item.installment_total})</span></p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-mono text-foreground font-bold">{formatRupiahShort(item.amount)}</p>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Content (Analytics Panel) */}
      <div className="w-full xl:w-[320px] shrink-0">
        {/* Quick Actions */}
        <div className="w-full h-auto sm:h-[44px] mb-6">
            <button onClick={() => openModal('bill')} className="w-full h-full flex items-center justify-center gap-2 py-3 sm:py-0 rounded-xl gradient-accent text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> Tambah Tagihan
            </button>
        </div>

        <h2 className="h-[20px] text-[13px] font-bold text-foreground mb-3 flex items-center">Analytics</h2>

        {/* Tagihan Summary */}
        <div className="glass-card p-5 mb-4 border border-border/50 bg-gradient-to-b from-card to-background">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ringkasan Tagihan</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
              <div className="text-xs text-muted-foreground">Belum Dibayar</div>
              <div className="text-sm font-bold font-mono text-amber">
                {formatRupiahShort((bills || []).filter(b => b.status !== "paid").reduce((s, b) => s + Number((b as any).remaining_amount || (b.amount - ((b as any).paid_amount || 0))), 0))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
              <div className="text-xs text-muted-foreground">Terlambat (Overdue)</div>
              <div className="text-sm font-bold font-mono text-red">
                {formatRupiahShort((bills || []).filter(b => b.status !== "paid" && b.due_date < today).reduce((s, b) => s + Number((b as any).remaining_amount || (b.amount - ((b as any).paid_amount || 0))), 0))}
              </div>
            </div>
          </div>
        </div>

        {/* PayLater Summary */}
        <div className="glass-card p-5 mb-4 border border-border/50 bg-gradient-to-b from-card to-background">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Ringkasan PayLater</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
              <div className="text-xs text-muted-foreground">Sisa Cicilan Bln Ini</div>
              <div className="text-sm font-bold font-mono text-foreground">
                {formatRupiahShort((plBills || []).filter(b => b.status !== "paid" && b.due_date.startsWith(today.substring(0, 7))).reduce((s, b) => s + Number((b as any).remaining_amount || (b.amount - ((b as any).paid_amount || 0))), 0))}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
              <div className="text-xs text-muted-foreground">Total Sisa Hutang</div>
              <div className="text-sm font-bold font-mono text-muted-foreground">
                {formatRupiahShort((plBills || []).reduce((s, b) => s + Number((b as any).remaining_amount || (b.amount - ((b as any).paid_amount || 0))), 0))}
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
              {(txns || []).filter(t => {
                const txt = ((t.categories?.name || "") + " " + (t.description || "") + " " + (t.notes || "")).toLowerCase();
                return txt.includes('tagihan') || txt.includes('bill') || txt.includes('cicilan') || t.paylater_bill_group_id != null || t.category_id === 'bills';
              }).slice(0, 6).map(t => (
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
              {(!txns || txns.filter(t => {
                const txt = ((t.categories?.name || "") + " " + (t.description || "") + " " + (t.notes || "")).toLowerCase();
                return txt.includes('tagihan') || txt.includes('bill') || txt.includes('cicilan') || t.paylater_bill_group_id != null || t.category_id === 'bills';
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
