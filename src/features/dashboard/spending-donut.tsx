"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort } from "@/lib/utils/formatters";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#38bdf8", "#a78bfa", "#fbbf24", "#34d399", "#f87171", "#fb7185"];
const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export function SpendingDonut() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard", "donut"],
    queryFn: async () => {
      const { start, end } = getMonthRange(0);
      const txns = await transactionService.getByDateRange(start, end);
      const grouped: Record<string, number> = {};
      txns
        .filter((t) => t.type === "expense" && !TRANSFER_CATS.includes(t.categories?.name || ""))
        .forEach((t) => {
          const k = t.categories?.name || "Lainnya";
          grouped[k] = (grouped[k] || 0) + Number(t.amount);
        });
      return Object.entries(grouped)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value]) => ({ name, value }));
    },
  });

  const total = (chartData || []).reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-foreground mb-4">Spending Breakdown</h3>

      {isLoading || !chartData ? (
        <div className="h-[200px] skeleton rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          Belum ada pengeluaran
        </div>
      ) : (
        <>
          <div className="h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10, fontSize: 12 }}
                  formatter={(v: unknown) => [formatRupiahShort(Number(v)), ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-base font-bold font-mono text-foreground">{formatRupiahShort(total)}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto font-mono">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
