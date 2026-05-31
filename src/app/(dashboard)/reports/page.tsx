"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort, formatRupiah, percentChange } from "@/lib/utils/formatters";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, LineChart, Line } from "recharts";
import { SpendingDonut } from "@/features/dashboard/spending-donut";
import { TrendingUp, TrendingDown, Calculator, Flame, FileText, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TRANSFER_CATS } from "@/lib/constants";
import Image from "next/image";

const db = () => createClient();

// Fallback names if not configured via environment variables
const HUSBAND_NAME = process.env.NEXT_PUBLIC_HUSBAND_NAME || "Tiu";
const WIFE_NAME = process.env.NEXT_PUBLIC_WIFE_NAME || "Rose";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

/* ---- Avatar component with fallback ---- */
function UserAvatar({ src, name, size = 44 }: { src?: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover border-2 border-border/30 shadow-lg"
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full border-2 border-border/30 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-foreground shadow-lg"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState<"Bulanan" | "Kuartal" | "Tahunan">("Bulanan");

  const { data, isLoading } = useQuery({
    queryKey: ["reports_comprehensive_v4", timeframe],
    queryFn: async () => {
      const months = [];
      
      // 1. Fetch Jago Wallet(s)
      const { data: jagoWallets } = await db().from('wallets').select('*').ilike('name', '%jago%');
      const jagoWalletIds = jagoWallets?.map(w => w.id) || [];
      let currentJagoBalance = jagoWallets?.reduce((sum, w) => sum + Number(w.balance), 0) || 0;

      // 2. Fetch all Jago transactions after the start of our chart period to work backwards
      // Or just fetch all Jago txns to be safe and calculate exact balances over time.
      const { data: allJagoTxns } = await db().from('transactions').select('amount, type, date').in('wallet_id', jagoWalletIds);
      const jagoTxnsSafe = allJagoTxns || [];

      const currentMonthUsers: Record<string, { income: number; expense: number; name: string; role: string; avatar_url: string | null }> = {
        [HUSBAND_NAME]: { name: HUSBAND_NAME, income: 0, expense: 0, role: "SUAMI", avatar_url: null },
        [WIFE_NAME]: { name: WIFE_NAME, income: 0, expense: 0, role: "ISTRI", avatar_url: null }
      };

      const iterations = timeframe === "Kuartal" ? 4 : timeframe === "Tahunan" ? 3 : 6;

      // Prepare periods
      const periods = [];
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
        periods.push({ start, end, label, i });
      }

      // Fetch all periods concurrently
      const fetchedPeriods = await Promise.all(
        periods.map(async (p) => {
          const txns = await transactionService.getByDateRange(p.start, p.end);
          return { ...p, txns };
        })
      );

      // Process results
      for (const { start, end, label, i, txns } of fetchedPeriods) {
        
        // Income & Expense calculation (ignoring transfers)
        const incomeTxns = txns.filter((t) => t.type === "income" && !TRANSFER_CATS.includes(t.categories?.name || ""));
        const expenseTxns = txns.filter((t) => t.type === "expense" && !TRANSFER_CATS.includes(t.categories?.name || ""));
        
        const inc = incomeTxns.reduce((s, t) => s + Number(t.amount), 0);
        const exp = expenseTxns.reduce((s, t) => s + Number(t.amount), 0);
        
        // Savings = Net flow of Bank Jago for this period
        const periodJagoTxns = jagoTxnsSafe.filter(t => t.date >= start.split('T')[0] && t.date <= end.split('T')[0]);
        const jagoInc = periodJagoTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const jagoExp = periodJagoTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
        const savings = jagoInc - jagoExp; // Net flow for the month
        
        // Calculate historical balance at the end of this period
        // It equals Current Balance - (Sum of net flow AFTER this period)
        const txnsAfterPeriod = jagoTxnsSafe.filter(t => t.date > end.split('T')[0]);
        const flowAfter = txnsAfterPeriod.reduce((s, t) => s + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0);
        const periodEndBalance = currentJagoBalance - flowAfter;

        months.push({ 
          label, 
          income: inc, 
          expense: exp, 
          savings: savings,
          cumulativeSavings: periodEndBalance
        });

        // User stats for the latest period
        if (i === 0) {
          txns.forEach(t => {
            if (TRANSFER_CATS.includes(t.categories?.name || "")) return;
            const userName = t.profiles?.name || HUSBAND_NAME;
            const avatarUrl = t.profiles?.avatar_url || null;
            const isRose = userName.toLowerCase().includes(WIFE_NAME.toLowerCase());
            const targetKey = isRose ? WIFE_NAME : HUSBAND_NAME;
            
            if (avatarUrl && !currentMonthUsers[targetKey].avatar_url) {
              currentMonthUsers[targetKey].avatar_url = avatarUrl;
            }

            if (t.type === "income") {
              currentMonthUsers[targetKey].income += Number(t.amount);
            } else if (t.type === "expense") {
              if (t.is_split) {
                const payerPct = t.split_percentage_payer ?? 50;
                const otherPct = t.split_percentage_other ?? 50;
                const otherKey = isRose ? HUSBAND_NAME : WIFE_NAME;
                
                currentMonthUsers[targetKey].expense += Number(t.amount) * (payerPct / 100);
                currentMonthUsers[otherKey].expense += Number(t.amount) * (otherPct / 100);
              } else {
                currentMonthUsers[targetKey].expense += Number(t.amount);
              }
            }
          });
        }
      }
      // Fetch profiles directly to ensure we have everyone's avatar
      const { data: profiles } = await db().from('profiles').select('*');
      if (profiles) {
        profiles.forEach(p => {
          const isRose = p.name.toLowerCase().includes(WIFE_NAME.toLowerCase());
          const targetKey = isRose ? WIFE_NAME : HUSBAND_NAME;
          if (p.avatar_url) {
            currentMonthUsers[targetKey].avatar_url = p.avatar_url;
          }
          currentMonthUsers[targetKey].name = p.name;
          currentMonthUsers[targetKey].role = p.role === 'wife' ? 'ISTRI' : 'SUAMI';
        });
      }

      return { months, users: Object.values(currentMonthUsers) };
    },
  });

  const chartData = data?.months || [];
  const rawUsers = data?.users || [];
  
  const familyUsers = [
    rawUsers.find(u => u.name === HUSBAND_NAME) || { name: HUSBAND_NAME, income: 0, expense: 0, role: "SUAMI", avatar_url: null },
    rawUsers.find(u => u.name === WIFE_NAME) || { name: WIFE_NAME, income: 0, expense: 0, role: "ISTRI", avatar_url: null }
  ];

  const current = chartData[chartData.length - 1];
  const prev = chartData[chartData.length - 2];
  const savingRate = current && current.income > 0 ? Math.round((current.savings / current.income) * 100) : 0;

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = async () => {
    try {
      const { data: txns, error } = await db()
        .from('transactions')
        .select('date, description, amount, type, categories(name), wallets(name), profiles!transactions_user_id_fkey(name)')
        .order('date', { ascending: false });
      
      if (error || !txns) {
        console.error("Gagal mengambil data:", error);
        return;
      }

      // Menggunakan titik koma (;) agar langsung terbaca sebagai kolom di Excel (Region Indonesia/Eropa)
      const header = "Tanggal;Deskripsi;Kategori;Tipe;Jumlah;Wallet;Pengguna\n";
      const rows = txns.map((t: any) => {
        const date = t.date;
        const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
        const cat = `"${t.categories?.name || ''}"`;
        const type = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
        const amount = t.amount;
        const wallet = `"${t.wallets?.name || ''}"`;
        const user = `"${t.profiles?.name || ''}"`;
        return `${date};${desc};${cat};${type};${amount};${wallet};${user}`;
      });

      const csvString = header + rows.join("\n");
      
      // Menggunakan Blob dengan BOM (Byte Order Mark) agar Excel membaca karakter UTF-8 dengan sempurna
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "detail_transaksi_hanfin.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error during CSV export:", err);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 md:space-y-6 pb-20">
      
      {/* Header & Download Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Laporan</h1>
          <p className="text-xs text-muted-foreground">Analisis keuangan 6 bulan terakhir</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors">
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-green/10 text-green border border-green/20 rounded-lg hover:bg-green/20 transition-colors">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
        </div>
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

      {/* Top Row: Pemasukan vs Pengeluaran & Kategori Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pemasukan vs Pengeluaran */}
        <motion.div variants={fadeUp} className="glass-card p-5 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[11px] font-bold text-green uppercase tracking-widest">PEMASUKAN VS PENGELUARAN</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Bandingkan tren keuangan</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-md">
                <button 
                  onClick={() => setTimeframe("Bulanan")}
                  className={cn("px-2 py-0.5 text-[9px] font-semibold rounded transition-colors", timeframe === "Bulanan" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >Bulanan</button>
                <button 
                  onClick={() => setTimeframe("Kuartal")}
                  className={cn("px-2 py-0.5 text-[9px] font-semibold rounded transition-colors", timeframe === "Kuartal" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >Kuartal</button>
                <button 
                  onClick={() => setTimeframe("Tahunan")}
                  className={cn("px-2 py-0.5 text-[9px] font-semibold rounded transition-colors", timeframe === "Tahunan" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                >Tahunan</button>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-sm bg-green/80" /> Pemasukan
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="w-2 h-2 rounded-sm bg-red/80" /> Pengeluaran
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-[280px] w-full mt-auto">
            {isLoading ? <div className="w-full h-full skeleton rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} 
                    formatter={(v: any, name: any) => [formatRupiah(Number(v)), name === "income" ? "Pemasukan" : "Pengeluaran"]} 
                  />
                  <Bar dataKey="income" fill="#34d399" radius={[6, 6, 0, 0]} barSize={12} />
                  <Bar dataKey="expense" fill="#f87171" radius={[6, 6, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Kategori Pengeluaran - Using Donut from Main Dashboard */}
        <motion.div variants={fadeUp} className="min-h-[420px] lg:h-auto">
           <SpendingDonut timeframe={timeframe} variant="reports" />
        </motion.div>
      </div>

      {/* Middle Row: Tren Tabungan & Tren Keuangan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        
        {/* Tren Tabungan (Original Version) */}
        <motion.div variants={fadeUp} className="glass-card p-5 flex flex-col h-full">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tren Tabungan</h3>
          <div className="h-[260px] w-full mt-auto">
            {isLoading ? <div className="w-full h-full skeleton rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs><linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} /><stop offset="100%" stopColor="#a78bfa" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
                  <Tooltip contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10, fontSize: 12 }} formatter={(v: unknown) => [formatRupiahShort(Number(v)), "Saldo Bank Jago"]} />
                  <Area type="monotone" dataKey="cumulativeSavings" stroke="#a78bfa" strokeWidth={2} fill="url(#savGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Tren Keuangan */}
        <motion.div variants={fadeUp} className="glass-card p-5 flex flex-col h-full">
           <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[11px] font-bold text-green uppercase tracking-widest">TREN KEUANGAN</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Analisis pola keuangan 6 bulan</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#34d399" }} /> Pemasukan
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#f87171" }} /> Pengeluaran
              </div>
               <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#60a5fa" }} /> Tabungan
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full mt-auto">
            {isLoading ? <div className="w-full h-full skeleton rounded-xl" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRupiahShort(v)} />
                  <Tooltip 
                    contentStyle={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} 
                    formatter={(v: any, name: any) => [formatRupiah(Number(v)), name === "income" ? "Pemasukan" : name === "expense" ? "Pengeluaran" : "Net Tabungan Jago"]} 
                  />
                  <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: "#f87171", strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="savings" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: "#60a5fa", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row: Perbandingan Anggota Keluarga — Compact Capsule Style */}
      <motion.div variants={fadeUp} className="glass-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[11px] font-bold text-green uppercase tracking-widest">PERBANDINGAN ANGGOTA KELUARGA</h3>
          <span className="text-[10px] text-muted-foreground">Bulan Ini</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
             <>
               <div className="h-28 skeleton rounded-2xl" />
               <div className="h-28 skeleton rounded-2xl" />
             </>
          ) : (
            familyUsers.map((user) => {
              const net = user.income - user.expense;
              const rate = user.income > 0 ? Math.round((net / user.income) * 100) : 0;
              const clampedRate = Math.max(0, Math.min(100, rate));
              const rateColor = rate >= 50 ? "#34d399" : rate >= 20 ? "#fbbf24" : "#f87171";

              return (
                <div key={user.name} className="relative rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-5 overflow-hidden">
                  {/* Subtle glow behind the progress */}
                  <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(ellipse at 30% 80%, ${rateColor}, transparent 70%)` }} />
                  
                  <div className="relative z-10 flex items-start gap-4">
                    {/* Avatar */}
                    <UserAvatar src={user.avatar_url} name={user.name} size={44} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-foreground text-sm leading-tight">{user.name}</h4>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-bold tracking-widest uppercase border border-primary/20">
                          {user.role}
                        </span>
                      </div>

                      {/* Income / Expense row */}
                      <div className="flex items-center gap-4 mt-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green" />
                          <span className="text-muted-foreground">Masuk</span>
                          <span className="font-mono font-semibold text-green">{formatRupiahShort(user.income)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-red" />
                          <span className="text-muted-foreground">Keluar</span>
                          <span className="font-mono font-semibold text-red">{formatRupiahShort(user.expense)}</span>
                        </div>
                      </div>

                      {/* Saving Rate progress bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-muted-foreground font-medium">Saving Rate</span>
                          <span className="text-xs font-mono font-bold" style={{ color: rateColor }}>{rate}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${clampedRate}%`,
                              background: `linear-gradient(90deg, ${rateColor}88, ${rateColor})`,
                              boxShadow: `0 0 12px ${rateColor}40`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
