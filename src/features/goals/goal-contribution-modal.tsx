"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useWallets, useCreateTransaction } from "@/hooks";
import { formatRupiahShort } from "@/lib/utils/formatters";

export function GoalContributionModal() {
  const { activeModal, closeModal, modalData } = useUIStore();
  const { user } = useAuth();
  const createTxn = useCreateTransaction();
  const { data: wallets } = useWallets();

  const isOpen = activeModal === "goal_contribution";
  const goal = modalData as any;

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [walletId, setWalletId] = useState("");
  const [adminFee, setAdminFee] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      setWalletId(wallets?.[0]?.id || "");
      setAdminFee("");
      setNotes("");
    }
  }, [isOpen, wallets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !walletId || !goal) return;

    createTxn.mutate(
      {
        payload: {
          wallet_id: walletId,
          category_id: "goals", // using a generic ID or goal ID
          type: "expense", // money leaving the wallet
          amount: Number(amount) + (Number(adminFee) || 0),
          date,
          description: `Kontribusi Goal: ${goal.name}`,
          notes,
          is_transfer: true,
        } as any,
        userId: user.id
      },
      { onSuccess: closeModal }
    );
  };

  if (!goal) return null;

  return (
    <Modal id="goal_contribution" title="Tambah Kontribusi" description={`Goal: ${goal.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Masuk ke:</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border">
            <span className="text-sm">{goal.icon}</span>
            <span className="text-xs font-semibold text-foreground">{goal.name}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Jumlah (Rp)</label>
          <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ambil Dari Wallet</label>
          <select required value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
            {wallets?.map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tanggal</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Biaya Admin (Rp)</label>
            <input type="number" value={adminFee} onChange={(e) => setAdminFee(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Keterangan..." className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
        </div>

        <div className="pt-2 flex gap-3">
          <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-card border border-border hover:bg-surface text-foreground font-bold rounded-xl transition-colors">
            Batal
          </button>
          <button type="submit" disabled={createTxn.isPending} className="flex-1 py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            + Kontribusi
          </button>
        </div>
      </form>
    </Modal>
  );
}
