// ============================================
// Wallet Service — Data Access Layer
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
      .insert({ ...payload, user_id: userId, is_active: true })
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
      try {
        const { error } = await db().rpc('increment_wallet', { wallet_id: walletId, delta });
        if (error) throw error;
      } catch {
        const { error } = await db()
          .from('wallets')
          .update({ balance: Math.max(0, Number(w.balance || 0) + delta) })
          .eq('id', walletId);
        if (error) throw error;
      }
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
      date: todayISO(),
      notes,
    });
    if (trErr) throw trErr;

    // 2. Update balances
    await walletService.updateBalance(from_wallet_id, -(amount + admin_fee));
    await walletService.updateBalance(to_wallet_id, amount);
  },
};
