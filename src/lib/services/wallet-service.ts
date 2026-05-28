// ============================================
// Wallet Service — Data Access Layer
// ============================================
// NOTE: Wallet balance updates for transactions are handled
// automatically by a Supabase database trigger.
// Only use updateBalance for non-transaction operations
// (e.g., PayLater used_limit adjustments).
// ============================================

import { createClient } from '@/lib/supabase/client';
import type { Wallet, CreateWalletDTO, UpdateWalletDTO, WalletTransferDTO } from '@/types';
import { todayISO } from '@/lib/utils/formatters';

const db = () => createClient();

export const walletService = {
  async getAll(): Promise<Wallet[]> {
    const { data, error } = await db()
      .from('wallets')
      .select('*')
      .order('wallet_category')
      .order('name');
    if (error) throw error;
    return (data || []) as Wallet[];
  },

  async getActive(): Promise<Wallet[]> {
    const { data, error } = await db()
      .from('wallets')
      .select('*')
      .eq('is_active', true)
      .order('wallet_category')
      .order('name');
    if (error) throw error;
    return (data || []) as Wallet[];
  },

  async getById(id: string): Promise<Wallet> {
    const { data, error } = await db().from('wallets').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Wallet;
  },

  async create(payload: CreateWalletDTO, userId: string): Promise<Wallet> {
    const { data, error } = await db()
      .from('wallets')
      .insert({ ...payload, user_id: userId, is_active: true, type: payload.wallet_category })
      .select()
      .single();
    if (error) throw error;
    return data as Wallet;
  },

  async update(payload: UpdateWalletDTO): Promise<Wallet> {
    const { id, ...rest } = payload;
    const { data, error } = await db().from('wallets').update(rest).eq('id', id).select().single();
    if (error) throw error;
    return data as Wallet;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('wallets').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  async updateBalance(walletId: string, delta: number): Promise<void> {
    if (!walletId || delta === 0) return;
    const { data: w, error: fetchErr } = await db()
      .from('wallets')
      .select('type, wallet_category, balance, used_limit')
      .eq('id', walletId)
      .single();
    if (fetchErr) throw fetchErr;
    if (!w) return;

    const isPL = w.wallet_category === 'liability' || w.type === 'liability';
    if (isPL) {
      const newUsed = Math.max(0, Number(w.used_limit || 0) - delta);
      const { error } = await db().from('wallets').update({ used_limit: newUsed }).eq('id', walletId);
      if (error) throw error;
    } else {
      const newBalance = Number(w.balance || 0) + delta;
      const { error } = await db()
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', walletId);
      if (error) throw error;
    }
  },

  async transfer(payload: WalletTransferDTO, userId: string): Promise<void> {
    const { from_wallet_id, to_wallet_id, amount, admin_fee = 0, notes } = payload;

    // 1. Record transfer
    const { error: trErr } = await db().from('wallet_transfers').insert({
      user_id: userId,
      from_wallet_id,
      to_wallet_id,
      amount,
      admin_fee,
      date: payload.date || todayISO(),
      notes,
    });
    if (trErr) throw trErr;

    // 2. Find Transfer categories
    const { data: cats } = await db()
      .from('categories')
      .select('id, name')
      .in('name', ['Transfer Keluar', 'Transfer Masuk', 'Biaya Admin']);

    const keluarCatId = cats?.find((c) => c.name === 'Transfer Keluar')?.id;
    const masukCatId = cats?.find((c) => c.name === 'Transfer Masuk')?.id;
    const adminCatId = cats?.find((c) => c.name === 'Biaya Admin')?.id;

    if (!keluarCatId || !masukCatId) {
      throw new Error('Kategori transfer belum dibuat. Tambahkan kategori "Transfer Keluar" dan "Transfer Masuk".');
    }

    const transferDate = payload.date || todayISO();
    const desc = payload.description || `Transfer ke wallet`;

    // 3. Build transaction pairs
    const txns: any[] = [];

    // Outgoing transfer
    txns.push({
      user_id: userId,
      type: 'expense',
      amount: amount,
      date: transferDate,
      category_id: keluarCatId,
      wallet_id: from_wallet_id,
      description: desc,
      notes: notes,
    });

    // Incoming transfer
    txns.push({
      user_id: userId,
      type: 'income',
      amount: amount,
      date: transferDate,
      category_id: masukCatId,
      wallet_id: to_wallet_id,
      description: desc,
      notes: notes,
      goal_id: payload.goal_id || null,
    });

    // Admin fee (if any)
    if (admin_fee > 0) {
      txns.push({
        user_id: userId,
        type: 'expense',
        amount: admin_fee,
        date: transferDate,
        category_id: adminCatId || keluarCatId,
        wallet_id: from_wallet_id,
        description: desc,
        notes: notes,
      });
    }

    const { error: txErr } = await db().from('transactions').insert(txns);
    if (txErr) throw txErr;

    // Wallet balances are updated automatically by Supabase trigger
    // (triggered by the transaction inserts above)
  },
};
