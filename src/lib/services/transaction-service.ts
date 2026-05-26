// ============================================
// Transaction Service — Data Access Layer
// ============================================

import { createClient } from '@/lib/supabase/client';
import type { Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilters } from '@/types';
import { walletService } from './wallet-service';

const db = () => createClient();

function getMonthRangeFromString(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(days)}` };
}

export const transactionService = {
  async getByMonth(month: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const { start, end } = getMonthRangeFromString(month);
    let q = db()
      .from('transactions')
      .select('*, categories(name,icon,color), wallets(name,icon), profiles!transactions_user_id_fkey(name)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.type && filters.type !== 'all' as string) q = q.eq('type', filters.type);
    if (filters?.categoryId) q = q.eq('category_id', filters.categoryId);
    if (filters?.walletId) q = q.eq('wallet_id', filters.walletId);

    const { data, error } = await q;
    if (error) throw error;

    let results = (data || []) as Transaction[];

    // Client-side search filter
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.description?.toLowerCase().includes(s) ||
          t.notes?.toLowerCase().includes(s) ||
          t.categories?.name?.toLowerCase().includes(s)
      );
    }

    return results;
  },

  async getRecent(limit: number = 6): Promise<Transaction[]> {
    const { data, error } = await db()
      .from('transactions')
      .select('*, categories(name,icon,color), profiles!transactions_user_id_fkey(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as Transaction[];
  },

  async getByDateRange(start: string, end: string): Promise<Transaction[]> {
    const { data, error } = await db()
      .from('transactions')
      .select('*, categories(name,icon,color)')
      .gte('date', start)
      .lte('date', end);
    if (error) throw error;
    return (data || []) as Transaction[];
  },

  async create(payload: CreateTransactionDTO, userId: string): Promise<Transaction> {
    const { data, error } = await db()
      .from('transactions')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;

    // Update wallet balance
    const delta = payload.type === 'income' ? payload.amount : -payload.amount;
    await walletService.updateBalance(payload.wallet_id, delta);

    return data as Transaction;
  },

  async update(payload: UpdateTransactionDTO, oldTxn: Transaction): Promise<Transaction> {
    const { id, ...rest } = payload;

    // Reverse old balance
    const oldDelta = oldTxn.type === 'income' ? -oldTxn.amount : oldTxn.amount;
    await walletService.updateBalance(oldTxn.wallet_id, oldDelta);

    const { data, error } = await db()
      .from('transactions')
      .update(rest)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Apply new balance
    const txn = data as Transaction;
    const newDelta = txn.type === 'income' ? txn.amount : -txn.amount;
    await walletService.updateBalance(txn.wallet_id, newDelta);

    return txn;
  },

  async delete(txn: Transaction): Promise<void> {
    const { error } = await db().from('transactions').delete().eq('id', txn.id);
    if (error) throw error;

    // Reverse balance
    const delta = txn.type === 'income' ? -txn.amount : txn.amount;
    await walletService.updateBalance(txn.wallet_id, delta);
  },

  async getTodayTransactions(): Promise<Transaction[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await db()
      .from('transactions')
      .select('*, categories(name, icon, color)')
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data || []) as Transaction[];
  },
};
