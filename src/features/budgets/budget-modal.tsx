"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCreateBudget, useCategories } from "@/hooks";
import { toast } from "@/components/ui/toaster";

export function BudgetModal() {
  const { activeModal, closeModal } = useUIStore();
  const { user } = useAuth();
  const createBudget = useCreateBudget();
  const { data: categories } = useCategories("expense");

  const isOpen = activeModal === "budget";

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [period, setPeriod] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setCategoryId(categories?.[0]?.id || "");
      setPeriod(new Date().toISOString().substring(0, 7));
      setNotes("");
    }
  }, [isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !period || !categoryId) {
      toast.error("Mohon lengkapi Kategori, Nominal, dan Periode");
      return;
    }

    try {
      await createBudget.mutateAsync({
        payload: {
          category_id: categoryId,
          amount: Number(amount),
          period: period,
          notes: notes || undefined,
        } as any,
        userId: user.id
      });

      toast.success("Budget berhasil disimpan");
      closeModal();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan budget");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal id="budget" title="SET BUDGET BIASA">
      <p className="text-xs text-muted-foreground mb-6 -mt-2">Atur batasan pengeluaran Anda untuk satu kategori di bulan tertentu</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori Pengeluaran</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
            <option value="">Pilih Kategori</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Batas Pengeluaran (Budget)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Periode Awal</label>
            <input type="month" required value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan (Opsional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Misal: Buat jajan" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={createBudget.isPending} className="w-full py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            Simpan Budget
          </button>
        </div>
      </form>
    </Modal>
  );
}
