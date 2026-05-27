"use client";

import { useBills } from "@/hooks";
import { formatRupiahShort, formatDate, todayISO } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

export function BillsDueWidget() {
  const { data: bills, isLoading } = useBills("unpaid");

  const today = todayISO();
  const sorted = [...(bills || [])].sort((a, b) => {
    const aOver = a.due_date < today ? 0 : 1;
    const bOver = b.due_date < today ? 0 : 1;
    if (aOver !== bOver) return aOver - bOver;
    return a.due_date.localeCompare(b.due_date);
  });

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-4">Tagihan Jatuh Tempo</h3>

      {isLoading ? (
        <div className="space-y-3 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="space-y-1.5">
                <div className="h-3 w-28 skeleton" />
                <div className="h-2.5 w-20 skeleton" />
              </div>
              <div className="h-4 w-16 skeleton" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <CheckCircle2 className="w-8 h-8 text-green mb-2 opacity-60" />
          <p className="text-xs font-medium text-muted-foreground">Tidak ada tagihan</p>
          <p className="text-[10px] text-dim mt-1">Semua tagihan aman</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1">
          {sorted.slice(0, 4).map((b) => {
            const isOverdue = b.due_date < today;
            const daysLeft = Math.ceil((new Date(b.due_date).getTime() - new Date(today).getTime()) / 86400000);
            return (
              <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div>
                  <p className={cn("text-sm font-medium", isOverdue ? "text-red" : "text-foreground")}>
                    {b.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isOverdue ? (
                      <AlertTriangle className="w-3 h-3 text-red" />
                    ) : daysLeft <= 3 ? (
                      <Clock className="w-3 h-3 text-amber" />
                    ) : (
                      <Clock className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className={cn(
                      "text-[11px] font-mono",
                      isOverdue ? "text-red" : daysLeft <= 3 ? "text-amber" : "text-muted-foreground"
                    )}>
                      {isOverdue ? `Terlambat ${Math.abs(daysLeft)} hari` : daysLeft === 0 ? "Hari ini!" : `${daysLeft} hari lagi`}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-semibold text-amber">
                    {formatRupiahShort(b.amount)}
                  </span>
                  <div className="mt-1">
                    <span className={cn(
                      "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase",
                      isOverdue ? "bg-red-dim text-red" : daysLeft <= 3 ? "bg-amber-dim text-amber" : "bg-primary-dim text-primary"
                    )}>
                      {isOverdue ? "Overdue" : daysLeft <= 3 ? "Segera" : "Upcoming"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
