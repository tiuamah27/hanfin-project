"use client";

import { motion } from "framer-motion";
import { StatCards } from "@/features/dashboard/stat-cards";
import { RecentTransactions } from "@/features/dashboard/recent-transactions";
import { BillsDueWidget } from "@/features/dashboard/bills-due-widget";
import { GoalsWidget } from "@/features/dashboard/goals-widget";
import { PayLaterUpcoming } from "@/features/dashboard/paylater-upcoming";
import { EquityChart } from "@/features/dashboard/equity-chart";
import { SpendingDonut } from "@/features/dashboard/spending-donut";
import { CashflowBar } from "@/features/dashboard/cashflow-bar";

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Stat Cards Row */}
      <motion.div variants={fadeUp}>
        <StatCards />
      </motion.div>

      {/* Main Charts - Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Equity Chart (2 cols) */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <EquityChart />
        </motion.div>

        {/* Donut Chart */}
        <motion.div variants={fadeUp}>
          <SpendingDonut />
        </motion.div>
      </div>

      {/* Cashflow + Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div variants={fadeUp} className="lg:col-span-2">
          <CashflowBar />
        </motion.div>

        <motion.div variants={fadeUp}>
          <BillsDueWidget />
        </motion.div>
      </div>

      {/* Recent Transactions + Goals + PayLater */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div variants={fadeUp}>
          <RecentTransactions />
        </motion.div>

        <motion.div variants={fadeUp}>
          <GoalsWidget />
        </motion.div>

        <motion.div variants={fadeUp}>
          <PayLaterUpcoming />
        </motion.div>
      </div>
    </motion.div>
  );
}
