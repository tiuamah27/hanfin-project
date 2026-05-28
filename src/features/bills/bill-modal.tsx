"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCreateBill, useUpdateBill, useWallets, useCategories, useBudgetItems } from "@/hooks";
import { formatRupiah, formatDate } from "@/lib/utils/formatters";
import { Edit2 } from "lucide-react";

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
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [budgetItemId, setBudgetItemId] = useState("");
  const [notes, setNotes] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<"none" | "weekly" | "monthly" | "yearly">("none");
  const [isEditing, setIsEditing] = useState(false);

  const { data: budgetItems } = useBudgetItems();
  const activeBudgetItems = (budgetItems || []).filter(bi => bi.category_id === categoryId);

  useEffect(() => {
    if (isOpen) {
      if (editBill) {
        setName(editBill.name || "");
        setAmount(editBill.amount?.toString() || "");
        setDueDate(editBill.due_date || new Date().toISOString().split("T")[0]);
        const rMatch = editBill.notes?.match(/^\[R:(weekly|monthly|yearly)\]\s*(.*)$/);
        const decodedNotes = rMatch ? rMatch[2] : (editBill.notes || "");
        const decodedRType = rMatch ? rMatch[1] : (editBill.is_recurring ? "monthly" : "none");
        
        setRecurrenceType(decodedRType as any);
        setCategoryId(editBill.category_id || "");
        setWalletId(editBill.wallet_id || "");
        setBudgetItemId(editBill.budget_item_id || "");
        setNotes(decodedNotes);
        setIsEditing(false);
      } else {
        setName("");
        setAmount("");
        setDueDate(new Date().toISOString().split("T")[0]);
        setRecurrenceType("none");
        setCategoryId(categories?.[0]?.id || "");
        setWalletId(wallets?.[0]?.id || "");
        setBudgetItemId("");
        setNotes("");
        setIsEditing(true);
      }
    }
  }, [isOpen, categories, wallets, editBill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !amount || !dueDate) return;

    const finalNotes = recurrenceType !== "none" ? `[R:${recurrenceType}] ${notes}`.trim() : notes;

    const payload = {
      name,
      amount: Number(amount),
      due_date: dueDate,
      is_recurring: recurrenceType !== "none",
      category_id: categoryId || undefined,
      wallet_id: walletId || undefined,
      budget_item_id: budgetItemId || undefined,
      notes: finalNotes || undefined,
    };

    if (editBill) {
      updateBill.mutate({ id: editBill.id, payload }, { onSuccess: closeModal });
    } else {
      createBill.mutate({ payload, userId: user.id }, { onSuccess: closeModal });
    }
  };

  return (
    <Modal id="bill" title={isEditing && editBill ? "Edit Tagihan" : editBill ? "Detail Tagihan" : "Tambah Tagihan"} description={editBill && !isEditing ? "Rincian tagihan reguler" : "Catat tagihan reguler yang perlu dibayar"}>
      {!isEditing && editBill ? (
        <div className="space-y-4 mt-2">
          <div className="p-4 rounded-xl bg-surface/50 border border-border space-y-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Nama Tagihan</p>
              <p className="text-sm font-semibold text-foreground">{name}</p>
            </div>
            
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Nominal</p>
              <p className="text-lg font-mono font-bold text-foreground">{formatRupiah(Number(amount))}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Kategori</p>
                <p className="text-sm text-foreground flex items-center gap-1.5">
                  {categories?.find(c => c.id === categoryId)?.icon} {categories?.find(c => c.id === categoryId)?.name || "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Sumber Dana</p>
                <p className="text-sm text-foreground flex items-center gap-1.5">
                  {wallets?.find(w => w.id === walletId)?.icon} {wallets?.find(w => w.id === walletId)?.name || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Jatuh Tempo</p>
                <p className="text-sm text-foreground">{dueDate ? formatDate(dueDate) : "-"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pengulangan</p>
                <p className="text-sm text-foreground">
                  {recurrenceType === "none" ? "Tidak Berulang" : recurrenceType === "weekly" ? "Mingguan" : recurrenceType === "monthly" ? "Bulanan" : "Tahunan"}
                </p>
              </div>
            </div>

            {notes && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Catatan</p>
                <p className="text-sm text-muted-foreground">{notes}</p>
              </div>
            )}
          </div>
          
          <div className="pt-2">
            <button onClick={() => setIsEditing(true)} className="w-full py-3.5 bg-card hover:bg-card/80 border border-border/50 text-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Edit2 className="w-4 h-4" /> Edit Tagihan
            </button>
          </div>
        </div>
      ) : (
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

        {/* Dynamic Budget Item Dropdown */}
        {categoryId && activeBudgetItems.length > 0 && (
          <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 -mt-1 mb-3">
            <label className="block text-xs font-medium text-primary mb-1.5">Rincian Budget (Opsional)</label>
            <select value={budgetItemId} onChange={(e) => setBudgetItemId(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              <option value="">-- Tidak Spesifik (Hanya Kategori) --</option>
              {activeBudgetItems.map((bi) => <option key={bi.id} value={bi.id}>{bi.name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tanggal Jatuh Tempo</label>
            <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pengulangan</label>
            <select value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value as any)} className="w-full px-3 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
              <option value="none">Tidak Berulang</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
        </div>

        <div className="pt-2 flex gap-3">
          {editBill && (
             <button type="button" onClick={() => setIsEditing(false)} className="w-1/3 py-3.5 bg-surface text-foreground font-semibold rounded-xl text-sm border border-border hover:bg-surface/80 transition-colors">
               Batal
             </button>
          )}
          <button type="submit" disabled={createBill.isPending || updateBill.isPending} className="flex-1 py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            Simpan Tagihan
          </button>
        </div>
      </form>
      )}
    </Modal>
  );
}
