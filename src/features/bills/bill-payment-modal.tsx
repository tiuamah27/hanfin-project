"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useWallets, useCreateTransaction, usePayBill } from "@/hooks";
import { formatRupiahShort } from "@/lib/utils/formatters";
import { toast } from "@/components/ui/toaster";
import { AlertTriangle } from "lucide-react";

export function BillPaymentModal() {
  const { activeModal, closeModal, modalData } = useUIStore();
  const { user } = useAuth();
  const { data: wallets } = useWallets();
  const createTxn = useCreateTransaction();
  const payBill = usePayBill();

  const isOpen = activeModal === "bill_payment";
  const bill = modalData as any; // Bill object

  const [walletId, setWalletId] = useState("");

  useEffect(() => {
    if (isOpen && bill) {
      // If bill has a predefined wallet, use it, else default to first wallet
      setWalletId(bill.wallet_id || wallets?.[0]?.id || "");
    }
  }, [isOpen, wallets, bill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !walletId || !bill) return;

    try {
      // 1. Create expense transaction
      await createTxn.mutateAsync({
        payload: {
          wallet_id: walletId,
          category_id: bill.category_id || "tagihan", 
          type: "expense",
          amount: bill.amount,
          date: new Date().toISOString().split("T")[0],
          description: `Bayar Tagihan: ${bill.name}`,
        } as any,
        userId: user.id
      });

      // 2. Mark bill as paid
      await payBill.mutateAsync(bill.id);

      closeModal();
    } catch (error: any) {
      toast.error(error.message || "Gagal melakukan pembayaran");
    }
  };

  if (!bill) return null;

  return (
    <Modal id="bill_payment" title="KONFIRMASI">
      <form onSubmit={handleSubmit} className="space-y-6 mt-2">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center border border-red/20 text-red">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Tandai <span className="text-foreground font-bold">"{bill.name}"</span> sebagai LUNAS? Ini akan otomatis membuat transaksi pengeluaran sebesar <span className="font-mono text-foreground font-bold">{formatRupiahShort(bill.amount)}</span>.
          </p>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">BAYAR DARI WALLET</label>
          <select required value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
            {wallets?.map((w) => (
              <option key={w.id} value={w.id}>{w.icon} {w.name} - {formatRupiahShort(w.balance)}</option>
            ))}
          </select>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={closeModal} className="flex-1 py-3 bg-card border border-border hover:bg-surface text-foreground font-bold rounded-lg transition-colors text-sm">
            BATAL
          </button>
          <button type="submit" disabled={createTxn.isPending || payBill.isPending} className="flex-1 py-3 bg-red hover:bg-red/90 text-white font-bold rounded-lg shadow-lg shadow-red/20 transition-all disabled:opacity-50 text-sm">
            YA, LANJUTKAN
          </button>
        </div>
      </form>
    </Modal>
  );
}
