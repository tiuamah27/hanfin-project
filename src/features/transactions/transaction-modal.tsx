"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useWallets, useCategories, useCreateTransaction, useUpdateTransaction } from "@/hooks";
import { cn } from "@/lib/utils";

export function TransactionModal() {
  const { activeModal, modalData, closeModal } = useUIStore();
  const { user } = useAuth();
  const { data: wallets } = useWallets();
  const { data: categories } = useCategories();
  const createTxn = useCreateTransaction();
  const updateTxn = useUpdateTransaction();

  const isEdit = !!modalData;
  const isOpen = activeModal === "transaction";

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (modalData) {
        setType(modalData.type);
        setAmount(modalData.amount.toString());
        setDate(modalData.date);
        setWalletId(modalData.wallet_id);
        setCategoryId(modalData.category_id);
        setDescription(modalData.description || "");
      } else {
        setType("expense");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setWalletId(wallets?.[0]?.id || "");
        setCategoryId("");
        setDescription("");
      }
    }
  }, [isOpen, modalData, wallets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !walletId || !categoryId || !amount) return;

    const payload = {
      type,
      amount: Number(amount),
      date,
      wallet_id: walletId,
      category_id: categoryId,
      description,
    };

    if (isEdit) {
      updateTxn.mutate(
        { payload: { id: modalData.id, ...payload }, oldTxn: modalData },
        { onSuccess: closeModal }
      );
    } else {
      createTxn.mutate(
        { payload, userId: user.id },
        { onSuccess: closeModal }
      );
    }
  };

  const activeCategories = categories?.filter((c) => c.type === type) || [];

  return (
    <Modal id="transaction" title={isEdit ? "Edit Transaksi" : "Tambah Transaksi"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex p-1 bg-surface rounded-xl border border-border">
          <button type="button" onClick={() => setType("expense")} className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", type === "expense" ? "bg-red text-white shadow-md" : "text-muted-foreground hover:text-foreground")}>Pengeluaran</button>
          <button type="button" onClick={() => setType("income")} className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", type === "income" ? "bg-green text-white shadow-md" : "text-muted-foreground hover:text-foreground")}>Pemasukan</button>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nominal</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50 transition-colors" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Dompet</label>
            <select required value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              <option value="" disabled>Pilih Dompet</option>
              {wallets?.map((w) => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori</label>
            <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              <option value="" disabled>Pilih Kategori</option>
              {activeCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tanggal</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opsional" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={createTxn.isPending || updateTxn.isPending} className="w-full py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            {isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
