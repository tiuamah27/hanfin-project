"use client";

import { useWallets } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { transactionService } from "@/lib/services/transaction-service";
import { formatRupiahShort, getMonthRange, percentChange } from "@/lib/utils/formatters";
import { TrendingUp, TrendingDown, Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

const TRANSFER_CATS = ["Transfer", "Transfer Keluar", "Transfer Masuk"];

export function StatCards() {
  const { data: wallets } = useWallets();

  const { data: stats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const { start, end } = getMonthRange(0);
      const { start: pStart, end: pEnd } = getMonthRange(-1);
      const [txnThis, txnLast] = await Promise.all([
        transactionService.getByDateRange(start, end),
        transactionService.getByDateRange(pStart, pEnd),
      ]);

      const sum = (rows: typeof txnThis, type: string) =>
        rows
          .filter((r) => r.type === type && !TRANSFER_CATS.includes(r.categories?.name || ""))
          .reduce((s, r) => s + Number(r.amount || 0), 0);

      const income = sum(txnThis, "income");
      const expense = sum(txnThis, "expense");
      const pIncome = sum(txnLast, "income");
      const pExpense = sum(txnLast, "expense");

      const savingsIds = (wallets || [])
        .filter((w) => (w.wallet_category || w.type) === "savings")
        .map((w) => w.id);

      const calcSav = (txns: typeof txnThis) => {
        const incSav = txns.filter((t) => t.type === "income" && savingsIds.includes(t.wallet_id)).reduce((s, t) => s + Number(t.amount), 0);
        const expSav = txns.filter((t) => t.type === "expense" && savingsIds.includes(t.wallet_id)).reduce((s, t) => s + Number(t.amount), 0);
        return incSav - expSav;
      };

      return {
        income,
        expense,
        savings: calcSav(txnThis),
        pIncome,
        pExpense,
        pSavings: calcSav(txnLast),
      };
    },
    enabled: !!wallets,
  });

  const totalBalance = (wallets || [])
    .filter((w) => w.is_active)
    .reduce((s, w) => s + Number(w.balance || 0), 0);

  const cards = [
    {
      label: "Total Saldo",
      value: totalBalance,
      sub: "Semua wallet aktif",
      icon: Wallet,
      className: "stat-card-balance",
      iconColor: "text-primary",
      trend: null,
    },
    {
      label: "Pemasukan",
      value: stats?.income || 0,
      sub: stats ? `${percentChange(stats.income, stats.pIncome)}% vs bulan lalu` : "—",
      icon: ArrowDownLeft,
      className: "stat-card-income",
      iconColor: "text-green",
      trend: stats ? percentChange(stats.income, stats.pIncome) : 0,
    },
    {
      label: "Pengeluaran",
      value: stats?.expense || 0,
      sub: stats ? `${percentChange(stats.expense, stats.pExpense)}% vs bulan lalu` : "—",
      icon: ArrowUpRight,
      className: "stat-card-expense",
      iconColor: "text-red",
      trend: stats ? -percentChange(stats.expense, stats.pExpense) : 0,
    },
    {
      label: "Tabungan",
      value: stats?.savings || 0,
      sub: stats && stats.income > 0 ? `${Math.round((stats.savings / stats.income) * 100)}% saving rate` : "—",
      icon: PiggyBank,
      className: "stat-card-savings",
      iconColor: "text-purple",
      trend: stats ? percentChange(stats.savings, stats.pSavings) : 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={cn(
            "glass-card p-4 md:p-5 border transition-all group",
            card.className
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {card.label}
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center bg-card/50",
                card.iconColor
              )}
            >
              <card.icon className="w-4 h-4" />
            </div>
          </div>

          <div className="text-lg md:text-xl font-bold text-foreground font-mono tracking-tight">
            {formatRupiahShort(card.value)}
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            {card.trend !== null && card.trend !== 0 && (
              card.trend > 0 ? (
                <TrendingUp className="w-3 h-3 text-green" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red" />
              )
            )}
            <span
              className={cn(
                "text-[11px]",
                card.trend === null || card.trend === 0
                  ? "text-muted-foreground"
                  : card.trend > 0
                    ? "text-green"
                    : "text-red"
              )}
            >
              {card.sub}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
