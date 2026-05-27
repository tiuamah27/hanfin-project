"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { useFilterStore } from "@/stores/filter-store";
import { formatRupiahShort, formatRupiah } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LayoutList, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from "lucide-react";
import { useState, useMemo } from "react";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export default function CalendarPage() {
  const { calendarMonth, setCalendarMonth } = useFilterStore();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [year, month] = calendarMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday=0
  const pad = (n: number) => String(n).padStart(2, "0");

  const monthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1));

  const startDate = `${year}-${pad(month)}-01`;
  const endDate = `${year}-${pad(month)}-${pad(daysInMonth)}`;

  const { data: txns, isLoading } = useQuery({
    queryKey: ["calendar", calendarMonth],
    queryFn: () => transactionService.getByDateRange(startDate, endDate),
  });

  // Aggregate spending per day
  const dayData = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    (txns || []).forEach((t) => {
      const day = t.date;
      if (!map[day]) map[day] = { income: 0, expense: 0 };
      if (t.type === "income" && !TRANSFER_CATS.includes(t.categories?.name || '')) {
        map[day].income += Number(t.amount);
      } else if (t.type === "expense" && !TRANSFER_CATS.includes(t.categories?.name || '')) {
        map[day].expense += Number(t.amount);
      }
    });
    return map;
  }, [txns]);

  // Aggregate monthly stats
  const monthlySummary = useMemo(() => {
    if (!txns) return { income: 0, expense: 0, net: 0, categories: [] as { name: string; amount: number }[] };
    let income = 0;
    let expense = 0;
    const catMap: Record<string, number> = {};
    
    txns.forEach(t => {
      if (TRANSFER_CATS.includes(t.categories?.name || '')) return;
      if (t.type === 'income') income += Number(t.amount);
      else {
        expense += Number(t.amount);
        const cat = t.categories?.name || 'Lainnya';
        catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
      }
    });
    
    const categories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount]) => ({ name, amount }));
      
    return { income, expense, net: income - expense, categories };
  }, [txns]);

  // Calculate thresholds for heatmap
  const expenses = Object.values(dayData).map((d) => d.expense).filter((e) => e > 0);
  const avgExpense = expenses.length > 0 ? expenses.reduce((a, b) => a + b, 0) / expenses.length : 0;
  const highThreshold = avgExpense * 1.5;

  const changeMonth = (d: number) => {
    const dt = new Date(year, month - 1 + d, 1);
    setCalendarMonth(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}`);
    setSelectedDay(null);
  };

  const getHeatColor = (expense: number) => {
    if (expense <= 0) return "bg-card/30";
    if (expense >= highThreshold) return "bg-red/10 border-red/20";
    if (expense >= avgExpense) return "bg-amber/10 border-amber/20";
    return "bg-green/10 border-green/20";
  };

  // Selected day detail
  const selectedDayTxns = useMemo(() => {
    if (!selectedDay || !txns) return [];
    return txns.filter((t) => t.date === selectedDay);
  }, [selectedDay, txns]);

  const selectedDayData = selectedDay ? dayData[selectedDay] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 md:space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Kalender</h1>
          <p className="text-xs text-muted-foreground">Analisis kas harian & bulanan</p>
        </div>

        {/* Month Nav */}
        <div className="flex items-center bg-card/50 border border-border/50 rounded-xl p-1 shadow-sm backdrop-blur-sm">
          <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-xs font-semibold text-foreground w-32 text-center">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-5">
        
        {/* Left Col: Calendar Grid */}
        <div className="glass-card p-4 md:p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-green uppercase tracking-widest">Heatmap Pengeluaran</h3>
            {/* Legend */}
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-card/30 border border-border" />Nihil</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green/10 border border-green/20" />Aman</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-amber/10 border border-amber/20" />Normal</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red/10 border border-red/20" />Tinggi</div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 h-[400px] skeleton rounded-xl" />
          ) : (
            <div className="flex-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest py-1.5 bg-card/30 rounded-md border border-border/20">{d}</div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before 1st */}
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`e-${i}`} className="min-h-[60px] md:min-h-[75px] rounded-lg border border-transparent bg-transparent" />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${pad(month)}-${pad(dayNum)}`;
                  const dd = dayData[dateStr];
                  const expense = dd?.expense || 0;
                  const income = dd?.income || 0;
                  const isSelected = selectedDay === dateStr;
                  const isToday = dateStr === new Date().toISOString().split("T")[0];

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      className={cn(
                        "min-h-[60px] md:min-h-[75px] rounded-lg border flex flex-col items-start p-1.5 md:p-2 transition-all text-xs relative overflow-hidden group hover:-translate-y-0.5",
                        getHeatColor(expense),
                        isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary shadow-lg shadow-primary/20" : "border-border/30",
                        isToday && !isSelected && "ring-1 ring-primary/40",
                        "hover:border-border-bright"
                      )}
                    >
                      <span className={cn("font-bold", isToday ? "text-primary" : "text-foreground", isSelected && "text-primary")}>{dayNum}</span>
                      
                      <div className="mt-auto w-full flex flex-col gap-0.5 pointer-events-none">
                        {income > 0 && (
                          <div className="flex items-center text-[9px] font-mono text-green leading-none">
                            <span className="truncate">+{formatRupiahShort(income).replace("Rp", "").trim()}</span>
                          </div>
                        )}
                        {expense > 0 && (
                          <div className="flex items-center text-[9px] font-mono text-red leading-none">
                            <span className="truncate">-{formatRupiahShort(expense).replace("Rp", "").trim()}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Day Detail / Month Summary */}
        <div className="glass-card p-4 md:p-5 flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar">
          {!selectedDay ? (
            // ================= MONTHLY SUMMARY =================
            <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-4 h-4 text-primary" />
                <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Ringkasan {monthLabel}</h3>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-20 skeleton rounded-xl" />
                  <div className="h-20 skeleton rounded-xl" />
                  <div className="h-32 skeleton rounded-xl" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <ArrowDownRight className="w-3.5 h-3.5 text-green" />
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Masuk</p>
                      </div>
                      <p className="text-sm font-bold font-mono text-foreground">{formatRupiahShort(monthlySummary.income)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-red" />
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Keluar</p>
                      </div>
                      <p className="text-sm font-bold font-mono text-foreground">{formatRupiahShort(monthlySummary.expense)}</p>
                    </div>
                    <div className={cn("col-span-2 p-3 rounded-xl border border-border/50 flex items-center justify-between", monthlySummary.net >= 0 ? "bg-green/5 border-green/20" : "bg-red/5 border-red/20")}>
                      <div className="flex items-center gap-1.5">
                        <ArrowRightLeft className={cn("w-3.5 h-3.5", monthlySummary.net >= 0 ? "text-green" : "text-red")} />
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Net Flow</p>
                      </div>
                      <p className={cn("text-base font-bold font-mono", monthlySummary.net >= 0 ? "text-green" : "text-red")}>
                        {monthlySummary.net > 0 ? "+" : ""}{formatRupiahShort(monthlySummary.net)}
                      </p>
                    </div>
                  </div>

                  {monthlySummary.categories.length > 0 ? (
                    <div className="flex-1 flex flex-col">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <LayoutList className="w-3 h-3" /> Top Pengeluaran
                      </h4>
                      <div className="space-y-4">
                        {monthlySummary.categories.map((c, i) => (
                          <div key={i} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-foreground font-medium">{c.name}</span>
                              <span className="font-mono text-muted-foreground text-[11px]">{formatRupiahShort(c.amount)}</span>
                            </div>
                            <div className="w-full h-1.5 bg-card border border-border/50 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]" style={{ width: `${Math.max(2, Math.min(100, (c.amount / monthlySummary.expense) * 100))}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 opacity-60">
                      <LayoutList className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">Belum ada rincian pengeluaran</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // ================= DAY DETAIL =================
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">
                  {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(selectedDay + "T12:00:00"))}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-[10px] bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors">
                  Tutup
                </button>
              </div>

              {/* Day Summary Cards */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-card border border-border/50 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Masuk</p>
                  <p className="text-xs font-bold font-mono text-green">{formatRupiahShort(selectedDayData?.income || 0)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/50 text-center">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Keluar</p>
                  <p className="text-xs font-bold font-mono text-red">{formatRupiahShort(selectedDayData?.expense || 0)}</p>
                </div>
              </div>

              <hr className="border-border/30 mb-4" />

              {/* Transactions List */}
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Daftar Transaksi</h4>
              {selectedDayTxns.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-60">
                  <LayoutList className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground text-center">Tidak ada transaksi di hari ini</p>
                </div>
              ) : (
                <div className="flex-1 space-y-2">
                  {selectedDayTxns.map((t) => {
                    const isIncome = t.type === "income";
                    return (
                      <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-card/30 border border-border/30 hover:bg-card/50 transition-colors">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", isIncome ? "bg-green/10 border-green/20 text-green" : "bg-red/10 border-red/20 text-red")}>
                          {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{t.categories?.name || "Lainnya"}</p>
                          {t.notes && <p className="text-[10px] text-muted-foreground truncate">{t.notes}</p>}
                        </div>
                        <span className={cn("text-xs font-mono font-bold shrink-0", isIncome ? "text-green" : "text-red")}>
                          {isIncome ? "+" : "-"}{formatRupiahShort(Number(t.amount))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
