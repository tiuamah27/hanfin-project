"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCreateBill, useUpdateBill, useWallets, useCategories } from "@/hooks";

export function BillModal() {
  const { activeModal, closeModal, modalData } = useUIStore();
  const { user } = useAuth();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  const { data: wallets } = useWallets();
  const { data: categories } = useCategories("expense");

  const isOpen = activeModal === "bill";
  const editBill = modalData as any;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editBill) {
        setName(editBill.name || "");
        setAmount(editBill.amount?.toString() || "");
        setDueDate(editBill.due_date || new Date().toISOString().split("T")[0]);
        setIsRecurring(editBill.is_recurring || false);
        setCategoryId(editBill.category_id || "");
        setWalletId(editBill.wallet_id || "");
        setNotes(editBill.notes || "");
      } else {
        setName("");
        setAmount("");
        setDueDate(new Date().toISOString().split("T")[0]);
        setIsRecurring(false);
        setCategoryId(categories?.[0]?.id || "");
        setWalletId(wallets?.[0]?.id || "");
        setNotes("");
      }
    }
  }, [isOpen, categories, wallets, editBill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !amount || !dueDate) return;

    const payload = {
      name,
      amount: Number(amount),
      due_date: dueDate,
      is_recurring: isRecurring,
      category_id: categoryId || undefined,
      wallet_id: walletId || undefined,
      notes: notes || undefined,
    };

    if (editBill) {
      updateBill.mutate({ id: editBill.id, payload }, { onSuccess: closeModal });
    } else {
      createBill.mutate({ payload, userId: user.id }, { onSuccess: closeModal });
    }
  };

  return (
    <Modal id="bill" title="Tambah Tagihan" description="Catat tagihan reguler yang perlu dibayar">
      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Tagihan</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" placeholder="Misal: Tagihan Listrik" />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nominal Tagihan</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              <option value="">Pilih Kategori</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sumber Dana (Opsional)</label>
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-3 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              <option value="">Pilih Dompet</option>
              {wallets?.map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tanggal Jatuh Tempo</label>
            <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div className="flex flex-col justify-end pb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background" />
              <span className="text-sm text-foreground">Tagihan Berulang</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
        </div>

        <div className="pt-2">
          <button type="submit" disabled={createBill.isPending} className="w-full py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            Simpan Tagihan
          </button>
        </div>
      </form>
    </Modal>
  );
}
