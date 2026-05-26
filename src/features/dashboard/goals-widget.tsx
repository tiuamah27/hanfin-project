"use client";

import { useGoals } from "@/hooks";
import { formatRupiahShort, formatDate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

const COLORS = ["bg-primary", "bg-purple", "bg-amber", "bg-green", "bg-rose"];

export function GoalsWidget() {
  const { data: goals, isLoading } = useGoals();

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-4">Goals Aktif</h3>

      {isLoading ? (
        <div className="space-y-4 flex-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 skeleton" />
              <div className="h-2 w-full skeleton" />
              <div className="h-2.5 w-24 skeleton" />
            </div>
          ))}
        </div>
      ) : !goals || goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-xs font-medium text-muted-foreground">Belum ada goal</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {goals.slice(0, 4).map((g, i) => {
            const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
            return (
              <div key={g.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-base">{g.icon}</span>
                  <span className="text-sm font-medium text-foreground truncate flex-1">{g.name}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{pct}%</span>
                </div>
                {g.deadline && (
                  <p className="text-[10px] font-mono text-dim mb-1.5 ml-7">
                    Target: {formatDate(g.deadline)}
                  </p>
                )}
                <div className="h-1.5 rounded-full bg-card overflow-hidden ml-7">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", COLORS[i % COLORS.length])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 ml-7">
                  <span className="text-[10px] font-mono text-muted-foreground">{formatRupiahShort(g.current_amount)}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">{formatRupiahShort(g.target_amount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
