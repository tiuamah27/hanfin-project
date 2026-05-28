"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCreateBudgetGroup, useUpdateBudgetGroup, useDeleteBudgetGroup } from "@/hooks";
import { toast } from "@/components/ui/toaster";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";


export function BudgetGroupBuilderModal() {
  const { activeModal, closeModal, modalData } = useUIStore();
  const { user } = useAuth();
  const createGroup = useCreateBudgetGroup();
  const updateGroup = useUpdateBudgetGroup();
  const deleteGroup = useDeleteBudgetGroup();

  const isOpen = activeModal === "budget_group";
  const editGroup = modalData as any;

  // Group Fields
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [color, setColor] = useState("#4ade80");
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editGroup) {
        setName(editGroup.name || "");
        setIcon(editGroup.icon || "📦");
        setColor(editGroup.color || "#4ade80");
        setIsRecurring(editGroup.is_recurring || false);
        setNotes(editGroup.notes || "");
      } else {
        resetForm();
      }
    }
  }, [isOpen, editGroup]);

  const resetForm = () => {
    setName("");
    setIcon("📦");
    setColor("#4ade80");
    setIsRecurring(false);
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!user || !name) {
      toast.error("Nama grup wajib diisi");
      return;
    }
    
    try {
      const payload = { 
        name, 
        icon, 
        color,
        is_recurring: isRecurring,
        notes: notes || null,
      };

      if (editGroup) {
        await updateGroup.mutateAsync({ id: editGroup.id, payload });
      } else {
        await createGroup.mutateAsync({ payload, userId: user.id });
      }
      
      closeModal();
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan grup");
    }
  };

  const handleDelete = async () => {
    if (!editGroup) return;
    try {
      await deleteGroup.mutateAsync(editGroup.id);
      setShowConfirmDelete(false);
      closeModal();
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus grup");
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <Modal id="budget_group" title={editGroup ? "EDIT BUDGET GROUP" : "TAMBAH BUDGET GROUP"} maxWidth="md">
      <div className="space-y-6">
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">NAMA GROUP</label>
            <div className="flex gap-3">
              <div className="w-[60px] shrink-0">
                <input 
                  type="text" 
                  maxLength={2}
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-center text-xl focus:outline-none focus:border-primary/50" 
                  placeholder="📦" 
                />
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" 
                  placeholder="Contoh: Pengeluaran Harian" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">PENGULANGAN</label>
              <select 
                value={isRecurring ? "true" : "false"} 
                onChange={(e) => setIsRecurring(e.target.value === "true")}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none"
              >
                <option value="false">Tidak Berulang</option>
                <option value="true">Berulang Tiap Bulan</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">CATATAN (OPSIONAL)</label>
              <input 
                type="text" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" 
                placeholder="Catatan tambahan..." 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1.5">WARNA</label>
            <div 
              className="relative w-full h-6 rounded-full overflow-hidden border border-border/50 cursor-pointer shadow-inner transition-colors"
              style={{ backgroundColor: color }}
            >
              <input 
                type="color" 
                value={color}
                onChange={e => setColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center px-2">Buat kategori besar untuk mengelompokkan pengeluaran (misal: Utilities, Household).</p>
        <div className="flex gap-3">
          {editGroup && (
            <button onClick={() => setShowConfirmDelete(true)} className="px-4 py-3 bg-red/10 text-red hover:bg-red/20 font-bold text-sm rounded-xl transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleSubmit} className="flex-1 py-3.5 gradient-accent text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            {editGroup ? "SIMPAN PERUBAHAN" : "SIMPAN GROUP"}
          </button>
        </div>
      </div>
    </Modal>
    <ConfirmModal
      isOpen={showConfirmDelete}
      title="Hapus Budget Group"
      message={`Apakah Anda yakin ingin menghapus grup "${editGroup?.name}"? Semua kategori di dalamnya mungkin akan kehilangan grup.`}
      onConfirm={handleDelete}
      onCancel={() => setShowConfirmDelete(false)}
    />
    </>
  );
}
