"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useUIStore } from "@/stores/ui-store";
import { useAuth, useCreateWallet, useUpdateWallet } from "@/hooks";
import { WALLET_CATEGORIES } from "@/lib/paylater";
import type { WalletCategory } from "@/types";

export function WalletModal() {
  const { activeModal, modalData, closeModal } = useUIStore();
  const { user } = useAuth();
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();

  const isEdit = !!modalData;
  const isOpen = activeModal === "wallet";

  const [name, setName] = useState("");
  const [category, setCategory] = useState<WalletCategory>("cash");
  const [balance, setBalance] = useState("");
  const [icon, setIcon] = useState("💰");
  
  useEffect(() => {
    if (isOpen) {
      if (modalData) {
        setName(modalData.name);
        setCategory(modalData.wallet_category as WalletCategory);
        setBalance(modalData.balance.toString());
        setIcon(modalData.icon || "💰");
      } else {
        setName("");
        setCategory("cash");
        setBalance("");
        setIcon("💰");
      }
    }
  }, [isOpen, modalData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      name,
      wallet_category: category,
      balance: Number(balance) || 0,
      icon,
    };

    if (isEdit) {
      updateWallet.mutate(
        { id: modalData.id, ...payload },
        { onSuccess: closeModal }
      );
    } else {
      createWallet.mutate(
        { payload, userId: user.id },
        { onSuccess: closeModal }
      );
    }
  };

  return (
    <Modal id="wallet" title={isEdit ? "Edit Wallet" : "Tambah Wallet"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nama Dompet / Bank</label>
          <div className="flex gap-2">
            <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="w-16 px-0 text-center py-3 bg-surface border border-border rounded-xl text-xl focus:outline-none focus:border-primary/50" placeholder="💰" />
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50" placeholder="BCA / Gopay / Dompet" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori</label>
          <select required value={category} onChange={(e) => setCategory(e.target.value as WalletCategory)} className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-foreground text-sm focus:outline-none focus:border-primary/50 appearance-none">
            {Object.entries(WALLET_CATEGORIES).map(([key, info]) => (
              <option key={key} value={key}>{info.icon} {info.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Saldo Awal</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">Rp</span>
            <input type="number" required value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-xl text-foreground font-mono focus:outline-none focus:border-primary/50" placeholder="0" disabled={isEdit} />
          </div>
          {isEdit && <p className="text-[10px] text-muted-foreground mt-1">Saldo hanya bisa diubah melalui transaksi penyesuaian/transfer.</p>}
        </div>

        <div className="pt-2">
          <button type="submit" disabled={createWallet.isPending || updateWallet.isPending} className="w-full py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50">
            {isEdit ? "Simpan Perubahan" : "Buat Wallet"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
