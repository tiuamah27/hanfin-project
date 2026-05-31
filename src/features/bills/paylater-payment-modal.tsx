"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useWallets, useCreateTransaction, usePayPaylaterBill, useCategories } from "@/hooks";
import { formatRupiahShort, formatRupiah } from "@/lib/utils/formatters";
import { getProviderInfo } from "@/lib/paylater";
import { toast } from "@/components/ui/toaster";

// Note: Ensure `usePayPaylaterBill` is available in hooks, if not we will implement it. 
// Assuming it exists or I will create it. 

export function PaylaterPaymentModal() {
  const { activeModal, closeModal, modalData } = useUIStore();
  const { user } = useAuth();
  const { data: wallets } = useWallets();
  const createTxn = useCreateTransaction();
  const payPaylater = usePayPaylaterBill(); 
  const { data: categories } = useCategories("expense");

  const isOpen = activeModal === "paylater_payment";
  const bill = modalData as any; // PayLaterBill object

  const [walletId, setWalletId] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (isOpen && bill) {
      setWalletId(wallets?.[0]?.id || "");
      const remaining = Number(bill.remaining_amount || (bill.amount - (bill.paid_amount || 0)));
      setAmount(remaining.toString());
    }
  }, [isOpen, wallets, bill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !walletId || !amount || !bill) return;

    try {
      const payAmount = Number(amount);
      // Find the Bayar PayLater category if it exists
      const payLaterCat = categories?.find(c => c.name.toLowerCase() === "bayar paylater");

      const itemsCount = (bill.paylater_bill_items || []).length;
      const notesText = itemsCount > 0 ? `${itemsCount} transaksi cicilan` : "Pembayaran cicilan";

      // 1. Create expense transaction
      await createTxn.mutateAsync({
        payload: {
          wallet_id: walletId,
          category_id: payLaterCat?.id || undefined,
          type: "expense",
          amount: payAmount,
          date: new Date().toISOString().split("T")[0],
          description: `Bayar ${getProviderInfo(bill.provider).label}`,
          notes: notesText,
        } as any,
        userId: user.id
      });

      // 2. Mark PayLater bill as paid/partial
      await payPaylater.mutateAsync({
        id: bill.id,
        amount: payAmount
      });

      closeModal();
      toast.success("Pembayaran PayLater berhasil!");
    } catch (error: any) {
      toast.error(error.message || "Gagal melakukan pembayaran");
    }
  };

  if (!bill) return null;

  const prov = getProviderInfo(bill.provider);
  const totalTagihan = bill.amount || 0;
  const remaining = Number(bill.remaining_amount || (bill.amount - (bill.paid_amount || 0)));
  const isPaid = bill.status === "paid";

  return (
    <Modal id="paylater_payment" title="BAYAR TAGIHAN PAYLATER">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Detail Box */}
        <div className="border border-border/50 rounded-xl p-4 bg-surface/50">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{prov.icon}</span>
              <span className="font-bold text-foreground text-sm">{prov.label}</span>
            </div>
            <span className="text-[9px] font-bold font-mono px-2 py-1 rounded-sm bg-amber-dim text-amber uppercase border border-amber/20">
              {bill.status || "UNPAID"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 tracking-wider">TOTAL TAGIHAN</p>
              <p className="font-mono text-amber font-bold text-sm">{formatRupiah(totalTagihan)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 tracking-wider">SISA</p>
              <p className="font-mono text-red font-bold text-sm">{formatRupiah(remaining)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 tracking-wider">PERIODE TAGIHAN</p>
              <p className="text-xs text-muted-foreground">{bill.billing_date ? new Date(bill.billing_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-'} - {bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 tracking-wider">JATUH TEMPO</p>
              <p className="text-xs text-muted-foreground">{bill.due_date ? new Date(bill.due_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}</p>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">BAYAR DARI WALLET</label>
          <select required value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
            {wallets?.map((w) => (
              <option key={w.id} value={w.id}>{w.icon} {w.name} - {formatRupiahShort(w.balance)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">JUMLAH BAYAR (RP)</label>
          <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-foreground font-mono focus:outline-none focus:border-primary/50" />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-card border border-border hover:bg-surface text-foreground font-bold rounded-lg transition-colors text-xs">
            BATAL
          </button>
          <button type="submit" disabled={createTxn.isPending || payPaylater.isPending} className="px-5 py-2.5 bg-green text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-xs flex items-center gap-2">
            BAYAR &rarr;
          </button>
        </div>
      </form>
    </Modal>
  );
}
