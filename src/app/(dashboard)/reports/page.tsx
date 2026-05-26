"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort, formatRupiah, percentChange } from "@/lib/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Calculator, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export default function ReportsPage() {
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const months: { label: string; income: number; expense: number; savings: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const { start, end } = getMonthRange(-i);
        const txns = await transactionService.getByDateRange(start, end);
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(d);
        const inc = txns.filter((t) => t.type === "income" && !TRANSFER_CATS.includes(t.categories?.name || "")).reduce((s, t) => s + Number(t.amount), 0);
        const exp = txns.filter((t) => t.type === "expense" && !TRANSFER_CATS.includes(t.categories?.name || "")).reduce((s, t) => s + Number(t.amount), 0);
        months.push({ label, income: inc, expense: exp, savings: inc - exp });
      }
      return months;
    },
  });

  const current = reportData?.[reportData.length - 1];
  const prev = reportData?.[reportData.length - 2];
  const savingRate = current && current.income > 0 ? Math.round((current.savings / current.income) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-foreground">Laporan</h1>
        <p className="text-xs text-muted-foreground">Analisis keuangan 6 bulan terakhir</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4 border stat-card-income">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-green" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Saving Rate</span></div>
          <p className="text-xl font-bold font-mono text-green">{savingRate}%</p>
        </div>
        <div className="glass-card p-4 border stat-card-expense">
          <div className="flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-red" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pengeluaran</span></div>
          <p className="text-xl font-bold font-mono text-red">{formatRupiahShort(current?.expense || 0)}</p>
          {prev && <p className={cn("text-[10px] font-mono mt-1", percentChange(current?.expense || 0, prev.expense) > 0 ? "text-red" : "text-green")}>{percentChange(current?.expense || 0, prev.expense)}% vs lalu</p>}
        </div>
        <div className="glass-card p-4 border stat-card-balance">
          <div className="flex items-center gap-2 mb-2"><Calculator className="w-4 h-4 text-primary" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg/Hari</span></div>
          <p className="text-xl font-bold font-mono text-foreground">{formatRupiahShort(current ? current.expense / 30 : 0)}</p>
        </div>
        <div className="glass-card p-4 border stat-card-savings">
          <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-purple" /><span className="text-[10px] text-muted-foreground uppercase tracking-wider">Net Bulan Ini</span></div>
          <p className={cn("text-xl font-bold font-mono", (current?.savings || 0) >= 0 ? "text-green" : "text-red")}>{formatRupiahShort(current?.savings || 0)}</p>
        </div>
      </div>

      {/* Charts */}
      {isLoading || !reportData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[300px] skeleton rounded-2xl" />
          <div className="h-[300px] skeleton rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Income vs Expense Bar */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pemasukan vs Pengeluaran</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
                  <Tooltip contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10, fontSize: 12 }} formatter={(v: any, name: any) => [formatRupiahShort(Number(v)), name === "income" ? "Masuk" : "Keluar"]} />
                  <Bar dataKey="income" fill="rgba(52,211,153,0.8)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="rgba(248,113,113,0.7)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Trend */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Tren Tabungan</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs><linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
                  <Tooltip contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10, fontSize: 12 }} formatter={(v: unknown) => [formatRupiahShort(Number(v)), "Tabungan"]} />
                  <Area type="monotone" dataKey="savings" stroke="#a78bfa" strokeWidth={2} fill="url(#savGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
