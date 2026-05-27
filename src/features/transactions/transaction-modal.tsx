"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useWallets, useCategories, useCreateTransaction, useUpdateTransaction } from "@/hooks";
import { isPayLaterWallet, calculateBilling } from "@/lib/paylater";
import { formatRupiah, formatDate, formatDateShort } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
  const [notes, setNotes] = useState("");
  const [isSplit, setIsSplit] = useState(false);
  const [splitPayer, setSplitPayer] = useState(50);
  const [splitOther, setSplitOther] = useState(50);
  const [installmentMonth, setInstallmentMonth] = useState<number>(1);

  const selectedWallet = wallets?.find(w => w.id === walletId);
  const isPayLater = isPayLaterWallet(selectedWallet);

  useEffect(() => {
    if (isOpen) {
      if (modalData) {
        setType(modalData.type);
        setAmount(modalData.amount.toString());
        setDate(modalData.date);
        setWalletId(modalData.wallet_id);
        setCategoryId(modalData.category_id);
        setDescription(modalData.description || "");
        setNotes(modalData.notes || "");
        setIsSplit(modalData.is_split || false);
        setSplitPayer(modalData.split_percentage_payer || 50);
        setSplitOther(modalData.split_percentage_other || 50);
        setInstallmentMonth(modalData.installment_total_month || 1);
      } else {
        setType("expense");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setWalletId(wallets?.[0]?.id || "");
        setCategoryId("");
        setDescription("");
        setNotes("");
        setIsSplit(false);
        setSplitPayer(50);
        setSplitOther(50);
        setInstallmentMonth(1);
      }
    }
  }, [isOpen, modalData, wallets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !walletId || !categoryId || !amount) return;

    const payload = {
      type,
      amount: (isPayLater && type === "expense") ? Number(amount) * installmentMonth : Number(amount),
      date,
      wallet_id: walletId,
      category_id: categoryId,
      description,
      notes,
      installment_total_month: isPayLater && type === "expense" ? installmentMonth : 1,
      ...(type === "expense" && isSplit ? {
        is_split: true,
        split_percentage_payer: splitPayer,
        split_percentage_other: splitOther,
      } : {
        is_split: false,
        split_percentage_payer: undefined,
        split_percentage_other: undefined,
      })
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

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Deskripsi / Judul</label>
          <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Contoh: Gaji Bulan Mei" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tanggal</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Catatan</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsional" className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" />
          </div>
        </div>

        {isPayLater && type === "expense" && (
          <div className="space-y-3 bg-surface/30 p-4 border border-border rounded-xl">
            <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Tenor Cicilan (PayLater)</label>
            <div className="space-y-2">
              {[1, 3, 6, 12].map(months => {
                const isSelected = installmentMonth === months;
                const monthlyAmt = amount ? Number(amount) : 0;
                const totalAmt = monthlyAmt * months;
                let periodText = "-";
                let dueDateText = "-";
                
                if (selectedWallet && date) {
                   try {
                     const cycle = calculateBilling(date, selectedWallet);
                     periodText = `${formatDateShort(cycle.periodStart)} - ${formatDateShort(cycle.periodEnd)}`;
                     dueDateText = formatDate(cycle.dueDate);
                   } catch(e) {}
                }

                return (
                  <div
                    key={months}
                    onClick={() => setInstallmentMonth(months)}
                    className={cn(
                      "p-3 border rounded-xl cursor-pointer transition-all",
                      isSelected ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "border-border hover:border-amber-500/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn("text-xs font-bold", isSelected ? "text-amber-500" : "text-muted-foreground")}>
                        {months === 1 ? "BAYAR PENUH (1X)" : `${months}X CICILAN`}
                      </span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border" />
                      )}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-sm font-bold text-foreground">Rp {formatRupiah(monthlyAmt)}</span>
                        <span className="text-[10px] text-muted-foreground"> / bulan</span>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Total: Rp {formatRupiah(totalAmt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-muted-foreground font-mono">Periode: {periodText}</div>
                        <div className="text-[9px] text-muted-foreground font-mono mt-0.5">Jatuh Tempo: {dueDateText}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {type === "expense" && (
          <div className="border border-border rounded-xl p-4 bg-surface/50">
            <div
              className="flex items-center gap-2 cursor-pointer mb-2 w-max"
              onClick={() => setIsSplit(!isSplit)}
            >
              <div className={cn("w-4 h-4 rounded flex items-center justify-center transition-colors", isSplit ? "bg-green text-background" : "bg-card border border-border")}>
                {isSplit && <Check className="w-3 h-3" strokeWidth={4} />}
              </div>
              <span className={cn("text-[10px] font-mono font-bold tracking-widest uppercase", isSplit ? "text-green" : "text-muted-foreground")}>
                Split Expense
              </span>
            </div>

            {isSplit && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1.5">Porsi Saya (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={splitPayer}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitPayer(val);
                      setSplitOther(100 - val);
                    }}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1.5">Porsi Pasangan (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={splitOther}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitOther(val);
                      setSplitPayer(100 - val);
                    }}
                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <button type="submit" disabled={createTxn.isPending || updateTxn.isPending} className="w-full py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            {isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
