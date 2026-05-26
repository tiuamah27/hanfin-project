"use client";

import { useRecentTransactions } from "@/hooks";
import { formatRupiahShort, formatDateShort } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function RecentTransactions() {
  const { data: txns, isLoading } = useRecentTransactions(6);

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Transaksi Terbaru</h3>
        <Link href="/transactions" className="text-[11px] text-primary hover:text-primary-hover flex items-center gap-1 transition-colors">
          Lihat Semua <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl skeleton" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 skeleton" />
                <div className="h-2.5 w-16 skeleton" />
              </div>
              <div className="h-3.5 w-16 skeleton" />
            </div>
          ))}
        </div>
      ) : !txns || txns.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div className="text-3xl mb-2">💸</div>
          <p className="text-xs font-medium text-muted-foreground">Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
              <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-base shrink-0">
                {t.categories?.icon || "📦"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {t.description || t.categories?.name || "Transaksi"}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {formatDateShort(t.date)}
                  {t.profiles?.name ? ` · ${t.profiles.name}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "text-sm font-mono font-semibold shrink-0",
                  t.type === "income" ? "text-green" : "text-red"
                )}
              >
                {t.type === "income" ? "+" : "-"}{formatRupiahShort(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
