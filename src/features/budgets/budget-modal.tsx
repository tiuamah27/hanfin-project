"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCreateBudgetItem, useUpdateBudgetItem, useDeleteBudgetItem, useCategories, useBudgetGroups } from "@/hooks";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export function BudgetModal() {
  const { activeModal, closeModal, modalData } = useUIStore();
  const { user } = useAuth();
  
  const createBudgetItem = useCreateBudgetItem();
  const updateBudgetItem = useUpdateBudgetItem();
  const deleteBudgetItem = useDeleteBudgetItem();
  
  const { data: categories } = useCategories("expense");
  const { data: groups } = useBudgetGroups();

  const isOpen = activeModal === "budget";
  const isEdit = !!modalData?.id;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [priority, setPriority] = useState("wajib");
  const [budgetType, setBudgetType] = useState("variable");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (modalData) {
        setName(modalData.name || "");
        setAmount(modalData.amount?.toString() || "");
        setCategoryId(modalData.category_id || categories?.[0]?.id || "");
        setGroupId(modalData.budget_group_id || groups?.[0]?.id || "");
        setPriority(modalData.priority || "wajib");
        setBudgetType(modalData.budget_type || "variable");
        setNotes(modalData.notes || "");
      } else {
        setName("");
        setAmount("");
        setCategoryId(categories?.[0]?.id || "");
        setGroupId(groups?.[0]?.id || "");
        setPriority("wajib");
        setBudgetType("variable");
        setNotes("");
      }
    }
  }, [isOpen, modalData, categories, groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !amount || !categoryId || !groupId) {
      toast.error("Mohon lengkapi semua field yang wajib");
      return;
    }

    try {
      const payload = {
        name,
        category_id: categoryId,
        budget_group_id: groupId,
        amount: Number(amount),
        priority: priority as "wajib" | "penting" | "fleksibel",
        budget_type: budgetType as "fixed" | "variable",
        notes: notes || null,
      };

      if (isEdit) {
        await updateBudgetItem.mutateAsync({
          id: modalData.id,
          payload
        });
        toast.success("Budget Item berhasil diperbarui");
      } else {
        await createBudgetItem.mutateAsync({
          payload,
          userId: user.id
        });
        toast.success("Budget Item berhasil ditambahkan");
      }

      closeModal();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan budget item");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Yakin ingin menghapus budget item ini?")) return;
    try {
      await deleteBudgetItem.mutateAsync(modalData.id);
      toast.success("Budget Item berhasil dihapus");
      closeModal();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus budget item");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal id="budget" title={isEdit ? "EDIT BUDGET ITEM" : "TAMBAH BUDGET ITEM"}>
      <p className="text-xs text-muted-foreground mb-6 -mt-2">
        {isEdit ? "Ubah rincian budget item ini." : "Tambahkan rincian budget baru beserta nominal, kategori, dan grupnya."}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Name & Amount in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Item</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" 
              placeholder="Misal: Air Galon" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Batas Pengeluaran</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
              <input 
                type="number" 
                required 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" 
                placeholder="0" 
              />
            </div>
          </div>
        </div>

        {/* Category & Group in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori Global</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)} 
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="">Pilih Kategori</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Budget Group</label>
            <select 
              value={groupId} 
              onChange={(e) => setGroupId(e.target.value)} 
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="">Pilih Group</option>
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Type & Priority in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipe Budget</label>
            <select 
              value={budgetType} 
              onChange={(e) => setBudgetType(e.target.value)} 
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="fixed">Fixed (Pasti)</option>
              <option value="variable">Variable (Berubah)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Prioritas</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)} 
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none"
            >
              <option value="wajib">Wajib 🔥</option>
              <option value="penting">Penting ⚡</option>
              <option value="fleksibel">Fleksibel 🌱</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan (Opsional)</label>
          <input 
            type="text" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" 
            placeholder="Catatan tambahan..." 
          />
        </div>

        <div className="pt-4 flex gap-3">
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={deleteBudgetItem.isPending} className="px-4 py-3.5 bg-red/10 text-red font-bold rounded-xl hover:bg-red/20 transition-colors disabled:opacity-50">
              Hapus
            </button>
          )}
          <button type="submit" disabled={createBudgetItem.isPending || updateBudgetItem.isPending} className="flex-1 py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            {createBudgetItem.isPending || updateBudgetItem.isPending ? "Menyimpan..." : "Simpan Item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
