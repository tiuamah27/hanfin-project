"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort } from "@/lib/utils/formatters";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function EquityChart() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard", "equity-chart"],
    queryFn: async () => {
      const newest = getMonthRange(0);
      const { data, error } = await (await import("@/lib/supabase/client")).createClient()
        .from("transactions")
        .select("type,amount,date")
        .lte("date", newest.end);
      if (error) throw error;

      const points: { label: string; balance: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const { end } = getMonthRange(-i);
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
        const bal = (data || [])
          .filter((r) => r.date <= end)
          .reduce((s, r) => s + (r.type === "income" ? Number(r.amount) : -Number(r.amount)), 0);
        points.push({ label, balance: Math.max(0, bal) });
      }
      return points;
    },
  });

  return (
    <div className="glass-card p-5 h-full">
      <h3 className="text-sm font-semibold text-foreground mb-4">Tren Saldo (6 Bulan)</h3>

      {isLoading || !chartData ? (
        <div className="h-[240px] skeleton rounded-xl" />
      ) : (
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
              <Tooltip
                contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#64748b" }}
                formatter={(v: unknown) => [formatRupiahShort(Number(v)), "Saldo"]}
              />
              <Area type="monotone" dataKey="balance" stroke="#38bdf8" strokeWidth={2} fill="url(#balGrad)" dot={false} activeDot={{ r: 5, fill: "#38bdf8", stroke: "#050816", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
