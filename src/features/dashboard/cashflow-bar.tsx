"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort } from "@/lib/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export function CashflowBar() {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard", "cashflow"],
    queryFn: async () => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const { start, end } = getMonthRange(0);
      const txns = await transactionService.getByDateRange(start, end);

      const incomeByDay = Array(daysInMonth).fill(0);
      const expenseByDay = Array(daysInMonth).fill(0);

      txns.forEach((t) => {
        if (TRANSFER_CATS.includes(t.categories?.name || "")) return;
        const day = new Date(t.date).getDate() - 1;
        if (t.type === "income") incomeByDay[day] += Number(t.amount);
        else expenseByDay[day] += Number(t.amount);
      });

      return Array.from({ length: daysInMonth }, (_, i) => ({
        day: String(i + 1),
        income: incomeByDay[i],
        expense: expenseByDay[i],
      }));
    },
  });

  return (
    <div className="glass-card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Cash Flow Harian</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-green" />
            <span className="text-[10px] text-muted-foreground">Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-red" />
            <span className="text-[10px] text-muted-foreground">Keluar</span>
          </div>
        </div>
      </div>

      {isLoading || !chartData ? (
        <div className="h-[220px] skeleton rounded-xl" />
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
              <Tooltip
                contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: "#64748b" }}
                formatter={(v: any, name: any) => [formatRupiahShort(Number(v)), name === "income" ? "Pemasukan" : "Pengeluaran"]}
              />
              <Bar dataKey="income" fill="rgba(52,211,153,0.7)" radius={[2, 2, 0, 0]} />
              <Bar dataKey="expense" fill="rgba(248,113,113,0.6)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
