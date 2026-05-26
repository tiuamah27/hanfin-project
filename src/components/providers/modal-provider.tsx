"use client";

import { TransactionModal } from "@/features/transactions/transaction-modal";
import { WalletModal } from "@/features/wallets/wallet-modal";
import { TransferModal } from "@/features/wallets/transfer-modal";
import { useUIStore } from "@/stores/ui-store";

export function ModalProvider() {
  const { activeModal } = useUIStore();

  // Return early if no modal is active to save rendering
  if (!activeModal) return null;

  return (
    <>
      <TransactionModal />
      <WalletModal />
      <TransferModal />
    </>
  );
}
