"use client";

import { useState, useEffect } from "react";
import { TransactionModal } from "@/features/transactions/transaction-modal";
import { WalletModal } from "@/features/wallets/wallet-modal";
import { TransferModal } from "@/features/wallets/transfer-modal";
import { BillModal } from "@/features/bills/bill-modal";
import { GoalModal } from "@/features/goals/goal-modal";
import { GoalContributionModal } from "@/features/goals/goal-contribution-modal";
import { BudgetModal } from "@/features/budgets/budget-modal";
import { BudgetGroupBuilderModal } from "@/features/budgets/budget-group-builder";
import { BillPaymentModal } from "@/features/bills/bill-payment-modal";
import { PaylaterPaymentModal } from "@/features/bills/paylater-payment-modal";

export function ModalProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <TransactionModal />
      <WalletModal />
      <TransferModal />
      <BillModal />
      <BillPaymentModal />
      <PaylaterPaymentModal />
      <GoalModal />
      <BudgetModal />
      <BudgetGroupBuilderModal />
      <GoalContributionModal />
    </>
  );
}
