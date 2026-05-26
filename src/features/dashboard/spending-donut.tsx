"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { getMonthRange, formatRupiahShort } from "@/lib/utils/formatters";
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";
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
};

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
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="w-[130px] h-[130px] relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="50%" 
                  innerRadius="35%" outerRadius="100%" 
                  barSize={10} 
                  data={chartData.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))} 
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                  <Tooltip content={<CustomTooltip />} cursor={false} position={{ x: -25, y: 35 }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="text-right flex-1 min-w-0">
              <p className="text-2xl font-bold font-mono text-foreground truncate">{formatRupiahShort(total)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Pengeluaran</p>
              <div className="inline-block mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono border border-primary/20">
                Bulan Ini
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
