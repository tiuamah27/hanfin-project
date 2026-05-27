"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort } from "@/lib/utils/formatters";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Eye, EyeOff } from "lucide-react";

const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export function EquityChart() {
  const [timeframe, setTimeframe] = useState<"Bulanan" | "Kuartal" | "Tahunan">("Bulanan");
  const [showIncome, setShowIncome] = useState(true);
  const [showExpense, setShowExpense] = useState(true);
  const [showSavings, setShowSavings] = useState(true);

  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard", "financial-trend", timeframe],
    queryFn: async () => {
      // Fetch Jago Wallets
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: jagoWallets } = await supabase.from('wallets').select('id').ilike('name', '%jago%');
      const jagoWalletIds = jagoWallets?.map(w => w.id) || [];

      const points: { label: string; income: number; expense: number; savings: number }[] = [];
      const iterations = timeframe === "Kuartal" ? 4 : timeframe === "Tahunan" ? 3 : 6;

      for (let i = iterations - 1; i >= 0; i--) {
        let start, end, label;
        const d = new Date();
        
        if (timeframe === "Kuartal") {
          d.setMonth(d.getMonth() - (i * 3));
          const q = Math.floor(d.getMonth() / 3) + 1;
          start = new Date(d.getFullYear(), (q - 1) * 3, 1).toISOString();
          end = new Date(d.getFullYear(), q * 3, 0).toISOString();
          label = `Q${q}`;
        } else if (timeframe === "Tahunan") {
          d.setFullYear(d.getFullYear() - i);
          start = new Date(d.getFullYear(), 0, 1).toISOString();
          end = new Date(d.getFullYear(), 12, 0).toISOString();
          label = `${d.getFullYear()}`;
        } else {
          const r = getMonthRange(-i);
          start = r.start;
          end = r.end;
          d.setMonth(d.getMonth() - i);
          label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
        }

        const txns = await transactionService.getByDateRange(start, end);
        
        const incomeTxns = txns.filter((t) => t.type === "income" && !TRANSFER_CATS.includes(t.categories?.name || ""));
        const expenseTxns = txns.filter((t) => t.type === "expense" && !TRANSFER_CATS.includes(t.categories?.name || ""));
        
        const inc = incomeTxns.reduce((s, t) => s + Number(t.amount), 0);
        const exp = expenseTxns.reduce((s, t) => s + Number(t.amount), 0);
        
        // Saving = Jago Net Flow
        const jagoTxns = txns.filter(t => jagoWalletIds.includes(t.wallet_id));
        const jagoInc = jagoTxns.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const jagoExp = jagoTxns.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        const savings = jagoInc - jagoExp;

        points.push({
          label,
          income: Math.max(0, inc),
          expense: Math.max(0, exp),
          savings: savings,
        });
      }
      return points;
    },
  });

  return (
    <div className="glass-card p-5 h-full flex flex-col">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tren Keuangan</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Pantau pemasukan, pengeluaran & tabungan Anda</p>
        </div>

        {/* Timeframe Controls */}
        <div className="flex bg-slate-950/40 p-0.5 rounded-lg border border-slate-800/40">
          {(["Bulanan", "Kuartal", "Tahunan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                timeframe === t
                  ? "bg-slate-800 text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Legend & Visibility Toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-5 shrink-0">
        {/* Pemasukan Toggle */}
        <button
          onClick={() => setShowIncome(!showIncome)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
            showIncome
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-slate-900/40 text-muted-foreground border-slate-800/30 opacity-60"
          }`}
        >
          {showIncome ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>Pemasukan</span>
        </button>

        {/* Pengeluaran Toggle */}
        <button
          onClick={() => setShowExpense(!showExpense)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
            showExpense
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-slate-900/40 text-muted-foreground border-slate-800/30 opacity-60"
          }`}
        >
          {showExpense ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>Pengeluaran</span>
        </button>

        {/* Saving Toggle */}
        <button
          onClick={() => setShowSavings(!showSavings)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
            showSavings
              ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
              : "bg-slate-900/40 text-muted-foreground border-slate-800/30 opacity-60"
          }`}
        >
          {showSavings ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>Saving</span>
        </button>
      </div>

      {/* Chart Area */}
      {isLoading || !chartData ? (
        <div className="flex-1 skeleton rounded-xl min-h-[240px]" />
      ) : (
        <div className="flex-1 w-full min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
              <Tooltip
                contentStyle={{
                  background: "rgba(11,18,32,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)"
                }}
                labelStyle={{ color: "#94a3b8", fontWeight: "bold", marginBottom: 4 }}
                formatter={(v: unknown, name: string) => {
                  const labelMap: Record<string, string> = {
                    income: "Pemasukan",
                    expense: "Pengeluaran",
                    savings: "Saving"
                  };
                  return [formatRupiahShort(Number(v)), labelMap[name] || name];
                }}
              />
              {showIncome && (
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#10b981", stroke: "#0b1220", strokeWidth: 2 }}
                />
              )}
              {showExpense && (
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#f43f5e", stroke: "#0b1220", strokeWidth: 2 }}
                />
              )}
              {showSavings && (
                <Area
                  type="monotone"
                  dataKey="savings"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#savingsGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#0ea5e9", stroke: "#0b1220", strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

