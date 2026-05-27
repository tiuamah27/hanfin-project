"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort } from "@/lib/utils/formatters";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#38bdf8", "#a78bfa", "#fbbf24", "#34d399", "#f87171", "#fb7185"];
const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const valueStr = formatRupiahShort(data.value).replace('Rp', '').trim();
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-card/95 backdrop-blur-md border border-border/50 py-2.5 px-4 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none"
      >
        <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: data.fill || payload[0].fill || COLORS[0] }} />
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground leading-none mb-1">Rp</span>
          <span className="text-sm font-bold text-foreground font-mono leading-none tracking-tight">{valueStr}</span>
        </div>
      </motion.div>
    );
  }
  return null;
}

export function SpendingDonut({ timeframe = "Bulanan", variant = "dashboard" }: { timeframe?: "Bulanan" | "Kuartal" | "Tahunan", variant?: "dashboard" | "reports" }) {
  const { data: chartData, isLoading } = useQuery({
    queryKey: ["dashboard", "donut", timeframe],
    queryFn: async () => {
      let start, end;
      const d = new Date();
      if (timeframe === "Kuartal") {
        const q = Math.floor(d.getMonth() / 3) + 1;
        start = new Date(d.getFullYear(), (q - 1) * 3, 1).toISOString();
        end = new Date(d.getFullYear(), q * 3, 0).toISOString();
      } else if (timeframe === "Tahunan") {
        start = new Date(d.getFullYear(), 0, 1).toISOString();
        end = new Date(d.getFullYear(), 12, 0).toISOString();
      } else {
        const r = getMonthRange(0);
        start = r.start;
        end = r.end;
      }

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
  
  const badgeText = timeframe === "Tahunan" ? "Tahun Ini" : timeframe === "Kuartal" ? "Kuartal Ini" : "Bulan Ini";

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <h3 className="text-sm font-bold text-foreground mb-6">Spending Breakdown</h3>

      {isLoading || !chartData ? (
        <div className="h-[240px] skeleton rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          Belum ada pengeluaran
        </div>
      ) : variant === "dashboard" ? (
        // DASHBOARD LAYOUT (Gambar 2: Donut kiri, Total kanan atas, Legend 2 kolom bawah)
        <div className="flex flex-col h-full gap-6">
          <div className="flex flex-row justify-between items-start">
            <div className="w-[180px] h-[180px] md:w-[200px] md:h-[200px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="50%" 
                  innerRadius="30%" outerRadius="100%" 
                  barSize={14} 
                  data={chartData.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))} 
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} dataKey="value" cornerRadius={20} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={false} position={{ x: -25, y: 35 }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-right pt-2">
              <p className="text-2xl md:text-3xl font-bold font-mono text-foreground tracking-tight">Rp {formatRupiahShort(total).replace('Rp', '').trim()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Pengeluaran</p>
              <div className="inline-block mt-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase border border-primary/20">
                {badgeText}
              </div>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3.5 text-left w-full">
            {chartData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2.5 text-xs text-muted-foreground w-full">
                <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto font-mono text-[11px] font-semibold text-foreground/80">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // REPORTS LAYOUT (Gambar 3: Centered, Donut kiri besar, Legend 1 kolom kanan)
        <div className="flex-1 flex flex-row items-center justify-center gap-8 md:gap-16 h-full w-full">
          {/* Left Side: Donut */}
          <div className="w-[220px] h-[220px] md:w-[260px] md:h-[260px] relative shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="30%" outerRadius="100%" 
                barSize={15} 
                data={chartData.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))} 
                startAngle={90} endAngle={-270}
              >
                <RadialBar background={{ fill: 'rgba(255,255,255,0.03)' }} dataKey="value" cornerRadius={20} />
                <RechartsTooltip content={<CustomTooltip />} cursor={false} position={{ x: -25, y: 35 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Right Side: Total + Legend */}
          <div className="flex flex-col justify-center h-full w-[220px] md:w-[260px] shrink-0">
            <div className="text-right mb-8">
              <p className="text-3xl md:text-4xl font-bold font-mono text-foreground truncate tracking-tight">Rp {formatRupiahShort(total).replace('Rp', '').trim()}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Pengeluaran</p>
              <div className="inline-block mt-3 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase border border-primary/20">
                {badgeText}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-auto grid grid-cols-1 gap-y-3.5 text-left ml-auto w-full">
              {chartData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3 text-xs md:text-sm text-muted-foreground w-full">
                  <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="truncate">{d.name}</span>
                  <span className="ml-auto font-mono text-[11px] md:text-xs font-semibold text-foreground/80">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
