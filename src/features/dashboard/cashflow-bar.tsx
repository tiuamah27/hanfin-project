"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort } from "@/lib/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export function CashflowBar() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "cashflow"],
    queryFn: async () => {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const { start, end } = getMonthRange(0);
      
      const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
      
      const startObj = new Date(start);
      const minStart = startObj < threeDaysAgo ? start : threeDaysAgo.toISOString();

      const txns = await transactionService.getByDateRange(minStart, end);

      const incomeByDay = Array(daysInMonth).fill(0);
      const expenseByDay = Array(daysInMonth).fill(0);

      const last3DaysStats = [
        { label: "Kemarin Lusa", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2), income: 0, expense: 0 },
        { label: "Kemarin", date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), income: 0, expense: 0 },
        { label: "Hari Ini", date: new Date(now.getFullYear(), now.getMonth(), now.getDate()), income: 0, expense: 0 },
      ];

      txns.forEach((t) => {
        if (TRANSFER_CATS.includes(t.categories?.name || "")) return;
        
        const tDate = new Date(t.date);
        
        if (tDate >= new Date(start) && tDate <= new Date(end)) {
          const day = tDate.getDate() - 1;
          if (day >= 0 && day < daysInMonth) {
            if (t.type === "income") incomeByDay[day] += Number(t.amount);
            else expenseByDay[day] += Number(t.amount);
          }
        }

        const tDateStr = t.date.split('T')[0]; 
        for (let i = 0; i < 3; i++) {
          const statDateStr = new Date(last3DaysStats[i].date.getTime() - last3DaysStats[i].date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
          if (tDateStr === statDateStr) {
             if (t.type === "income") last3DaysStats[i].income += Number(t.amount);
             else last3DaysStats[i].expense += Number(t.amount);
          }
        }
      });

      const chartPoints = Array.from({ length: daysInMonth }, (_, i) => ({
        day: String(i + 1),
        income: incomeByDay[i],
        expense: expenseByDay[i],
      }));

      return { chartPoints, last3DaysStats };
    },
  });

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Cash Flow Harian</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span className="text-[10px] text-muted-foreground">Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
            <span className="text-[10px] text-muted-foreground">Keluar</span>
          </div>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex-1 skeleton rounded-xl min-h-[220px]" />
      ) : (
        <div className="flex flex-col flex-1">
          <div className="w-full min-h-[200px] flex-1 mb-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartPoints} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
                <Tooltip
                  contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: 4 }}
                  formatter={(v: any, name: any) => [formatRupiahShort(Number(v)), name === "income" ? "Pemasukan" : "Pengeluaran"]}
                />
                <Bar dataKey="income" fill="#34d399" radius={[2, 2, 0, 0]} opacity={0.8} />
                <Bar dataKey="expense" fill="#fb7185" radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3 Days Comparison (Dead zone filler) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t border-slate-800/50 pt-4 shrink-0">
            {data.last3DaysStats.map((stat, idx) => (
              <div key={idx} className="flex flex-col bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50">
                <span className="text-[10px] font-medium text-slate-400 mb-2 text-center">{stat.label}</span>
                <div className="flex justify-between items-center px-1">
                  <div className="flex flex-col">
                    <span className="text-[8px] uppercase tracking-wider text-emerald-500/70 font-semibold">In</span>
                    <span className="text-xs font-bold text-emerald-400">{formatRupiahShort(stat.income)}</span>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-800/60 mx-2" />
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase tracking-wider text-rose-500/70 font-semibold">Out</span>
                    <span className="text-xs font-bold text-rose-400">{formatRupiahShort(stat.expense)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
