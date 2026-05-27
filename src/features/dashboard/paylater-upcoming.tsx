"use client";

import { usePayLaterBills } from "@/hooks";
import { formatRupiah, formatDateShort, todayISO } from "@/lib/utils/formatters";
import { getProviderInfo } from "@/lib/paylater";
import { cn } from "@/lib/utils";

export function PayLaterUpcoming() {
  const { data: bills, isLoading } = usePayLaterBills({ statusFilter: 'unpaid', limit: 5 });
  const unpaid = bills || [];
  const today = todayISO();

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-4">PayLater Upcoming</h3>

      {isLoading ? (
        <div className="space-y-3 flex-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 skeleton rounded-lg" />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 skeleton" />
                  <div className="h-2.5 w-16 skeleton" />
                </div>
              </div>
              <div className="h-4 w-20 skeleton" />
            </div>
          ))}
        </div>
      ) : unpaid.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-xs font-medium text-muted-foreground">Tidak ada cicilan aktif</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1">
          {unpaid.slice(0, 5).map((b) => {
            const provInfo = getProviderInfo(b.provider);
            const remaining = Number(b.amount) - Number(b.paid_amount || 0);
            const isOverdue = b.due_date < today;
            const dueDays = Math.ceil((new Date(b.due_date + "T12:00:00").getTime() - Date.now()) / 86400000);
            const dueLabel = isOverdue
              ? `Terlambat ${Math.abs(dueDays)} hari`
              : dueDays <= 7
                ? `${dueDays} hari lagi`
                : formatDateShort(b.due_date);

            return (
              <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="text-lg">{provInfo.icon}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {b.wallets?.name || provInfo.label}
                    </p>
                    <p className={cn(
                      "text-[10px] font-mono",
                      isOverdue ? "text-red" : dueDays <= 7 ? "text-amber" : "text-muted-foreground"
                    )}>
                      {dueLabel}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-mono font-semibold text-amber">
                  {formatRupiah(remaining)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
