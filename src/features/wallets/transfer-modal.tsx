"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useWallets, useTransferWallet } from "@/hooks";
import { ArrowRightLeft } from "lucide-react";

export function TransferModal() {
  const { activeModal, closeModal } = useUIStore();
  const { user } = useAuth();
  const { data: wallets } = useWallets();
  const transfer = useTransferWallet();

  const isOpen = activeModal === "transfer";

  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [amount, setAmount] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFromWalletId(wallets?.[0]?.id || "");
      setToWalletId(wallets?.[1]?.id || "");
      setAmount("");
      setAdminFee("");
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [isOpen, wallets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fromWalletId || !toWalletId || !amount || fromWalletId === toWalletId) return;

    transfer.mutate(
      {
        payload: {
          from_wallet_id: fromWalletId,
          to_wallet_id: toWalletId,
          amount: Number(amount),
          admin_fee: adminFee ? Number(adminFee) : undefined,
          date,
          notes,
        },
        userId: user.id
      },
      { onSuccess: closeModal }
    );
  };

  return (
    <Modal id="transfer" title="Transfer Antar Wallet" description="Pindahkan saldo dari satu dompet ke dompet lain">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Dari Dompet</label>
            <select required value={fromWalletId} onChange={(e) => setFromWalletId(e.target.value)} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              {wallets?.map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
            </select>
          </div>
          <div className="pt-5 px-1 text-muted-foreground"><ArrowRightLeft className="w-4 h-4" /></div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Ke Dompet</label>
            <select required value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} className="w-full px-3 py-2.5 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              {wallets?.filter(w => w.id !== fromWalletId).map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nominal Transfer</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
              <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Biaya Admin</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
              <input type="number" value={adminFee} onChange={(e) => setAdminFee(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tanggal</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={transfer.isPending} className="w-full py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            Kirim Transfer
          </button>
        </div>
      </form>
    </Modal>
  );
}
