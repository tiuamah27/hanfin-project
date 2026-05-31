// ============================================
// Transaction Service — Data Access Layer
// ============================================
// NOTE: Wallet balance updates are handled automatically by a
// Supabase database trigger on the transactions table.
// Do NOT add manual walletService.updateBalance() calls here.
// ============================================

import { createClient } from '@/lib/supabase/client';
import { TransactionSchema, UpdateTransactionSchema } from '@/lib/validations/schema';
import type { Transaction, CreateTransactionDTO, UpdateTransactionDTO, TransactionFilters, Wallet } from '@/types';
import { isPayLaterWallet } from '@/lib/paylater/billing-cycle';
import { generatePayLaterInstallments } from '@/lib/paylater/installment-generator';

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
    
    // Server-side search filter
    if (filters?.search) {
      const s = filters.search;
      // Search in description or notes
      q = q.or(`description.ilike.%${s}%,notes.ilike.%${s}%`);
    }

    // Limit to prevent massive payloads, though monthly filtering naturally bounds it.
    q = q.limit(500);

    const { data, error } = await q;
    if (error) throw error;

    return (data || []) as Transaction[];
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
      .select('*, categories(name,icon,color), profiles!transactions_user_id_fkey(name, avatar_url)')
      .gte('date', start)
      .lte('date', end);
    if (error) throw error;
    return (data || []) as Transaction[];
  },

  async create(payload: CreateTransactionDTO, userId: string): Promise<Transaction> {
    // Validate with Zod
    const validatedData = TransactionSchema.parse(payload);

    const { data, error } = await db()
      .from('transactions')
      .insert({ ...validatedData, user_id: userId })
      .select()
      .single();
    if (error) throw error;

    const txn = data as Transaction;

    // Post-creation hooks (e.g., PayLater installments)
    if (txn.type === 'expense' && txn.wallet_id) {
      const { data: walletData } = await db().from('wallets').select('*').eq('id', txn.wallet_id).single();
      if (walletData && isPayLaterWallet(walletData as Wallet)) {
        const tenor = txn.installment_total_month || 1;
        await generatePayLaterInstallments(txn, tenor, walletData as Wallet, userId);
      }
    }

    // Wallet balance is updated automatically by Supabase trigger
    return txn;
  },

  async update(payload: UpdateTransactionDTO, oldTxn: Transaction): Promise<Transaction> {
    // Validate with Zod
    const validatedData = UpdateTransactionSchema.parse(payload);
    const { id, ...rest } = validatedData;

    // Wallet balance adjustments are handled automatically by Supabase trigger
    const { data, error } = await db()
      .from('transactions')
      .update(rest)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    return data as Transaction;
  },

  async delete(txn: Transaction): Promise<void> {
    const { error } = await db().from('transactions').delete().eq('id', txn.id);
    if (error) throw error;

    // Wallet balance reversal is handled automatically by Supabase trigger
  },


};
