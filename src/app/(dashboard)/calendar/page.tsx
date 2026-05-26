"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { useFilterStore } from "@/stores/filter-store";
import { formatRupiahShort, formatRupiah } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

const DAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

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
      if (t.type === "income") map[day].income += Number(t.amount);
      else map[day].expense += Number(t.amount);
    });
    return map;
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
    if (expense >= highThreshold) return "bg-red/20 border-red/30";
    if (expense >= avgExpense) return "bg-amber/15 border-amber/20";
    return "bg-green/10 border-green/20";
  };

  // Selected day detail
  const selectedDayTxns = useMemo(() => {
    if (!selectedDay || !txns) return [];
    return txns.filter((t) => t.date === selectedDay);
  }, [selectedDay, txns]);

  const selectedDayData = selectedDay ? dayData[selectedDay] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Kalender</h1>
        <p className="text-xs text-muted-foreground">Heatmap pengeluaran harian</p>
      </div>

      {/* Month Nav */}
      <div className="flex items-center gap-2 justify-center">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-card text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
        <span className="text-base font-semibold text-foreground w-48 text-center">{monthLabel}</span>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-card text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-card/30 border border-border" />Tidak ada</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green/10 border border-green/20" />Rendah</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber/15 border border-amber/20" />Normal</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red/20 border border-red/30" />Tinggi</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass-card p-5">
          {isLoading ? (
            <div className="h-[360px] skeleton rounded-xl" />
          ) : (
            <>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1">{d}</div>
                ))}
              </div>

              {/* Day Cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before 1st */}
                {Array.from({ length: firstDayOfWeek }, (_, i) => (
                  <div key={`e-${i}`} className="aspect-square" />
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
                        "aspect-square rounded-lg border flex flex-col items-center justify-center p-1 transition-all text-xs",
                        getHeatColor(expense),
                        isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "border-border/30",
                        isToday && "ring-1 ring-primary/50",
                        "hover:border-border-bright"
                      )}
                    >
                      <span className={cn("font-medium", isToday ? "text-primary" : "text-foreground")}>{dayNum}</span>
                      {expense > 0 && (
                        <span className="text-[8px] font-mono text-red mt-0.5 hidden sm:block">
                          -{formatRupiahShort(expense).replace("Rp ", "")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Day Detail Panel */}
        <div className="glass-card p-5">
          {!selectedDay ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm text-muted-foreground">Pilih tanggal untuk melihat detail</p>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(selectedDay + "T12:00:00"))}
              </h3>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-green-dim">
                  <p className="text-[9px] text-muted-foreground">Masuk</p>
                  <p className="text-xs font-bold font-mono text-green">{formatRupiahShort(selectedDayData?.income || 0)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-dim">
                  <p className="text-[9px] text-muted-foreground">Keluar</p>
                  <p className="text-xs font-bold font-mono text-red">{formatRupiahShort(selectedDayData?.expense || 0)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-primary-dim">
                  <p className="text-[9px] text-muted-foreground">Net</p>
                  <p className={cn("text-xs font-bold font-mono", ((selectedDayData?.income || 0) - (selectedDayData?.expense || 0)) >= 0 ? "text-green" : "text-red")}>
                    {formatRupiahShort((selectedDayData?.income || 0) - (selectedDayData?.expense || 0))}
                  </p>
                </div>
              </div>

              {/* Transactions */}
              {selectedDayTxns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Tidak ada transaksi</p>
              ) : (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {selectedDayTxns.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-xs font-medium text-foreground">{t.categories?.name || "Transaksi"}</p>
                      </div>
                      <span className={cn("text-xs font-mono font-semibold", t.type === "income" ? "text-green" : "text-red")}>
                        {t.type === "income" ? "+" : "-"}{formatRupiah(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
