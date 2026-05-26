"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCreateGoal, useWallets } from "@/hooks";

export function GoalModal() {
  const { activeModal, closeModal } = useUIStore();
  const { user } = useAuth();
  const createGoal = useCreateGoal();
  const { data: wallets } = useWallets();

  const isOpen = activeModal === "goal";

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [walletId, setWalletId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName("");
      setIcon("🎯");
      setTargetAmount("");
      setDeadline("");
      setWalletId(wallets?.[0]?.id || "");
      setNotes("");
    }
  }, [isOpen, wallets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !targetAmount) return;

    createGoal.mutate(
      {
        payload: {
          name,
          icon,
          target_amount: Number(targetAmount),
          deadline: deadline || undefined,
          wallet_id: walletId || undefined,
          notes: notes || undefined,
        } as any,
        userId: user.id
      },
      { onSuccess: closeModal }
    );
  };

  return (
    <Modal id="goal" title="Buat Goal Baru" description="Tetapkan target tabungan masa depan Anda">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div className="grid grid-cols-[60px_1fr] gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ikon</label>
            <input type="text" required value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full px-0 py-3 bg-surface border border-border rounded-xl text-foreground text-center text-xl focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Goal</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" placeholder="Misal: Beli MacBook M3" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Target Tabungan</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
            <input type="number" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tenggat Waktu (Opsional)</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Simpan di Dompet (Opsional)</label>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-3 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              <option value="">Tidak Ditentukan</option>
              {wallets?.map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan/Deskripsi</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tujuan nabung..." className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={createGoal.isPending} className="w-full py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            Simpan Goal
          </button>
        </div>
      </form>
    </Modal>
  );
}
