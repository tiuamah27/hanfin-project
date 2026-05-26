// ============================================
// Bill Service — Data Access Layer
// ============================================

import { createClient } from '@/lib/supabase/client';
import type { Bill, CreateBillDTO, PayLaterBill } from '@/types';

const db = () => createClient();

export const billService = {
  async getAll(statusFilter?: string): Promise<Bill[]> {
    let q = db().from('bills').select('*').order('due_date');
    if (statusFilter && statusFilter !== 'all') {
      q = q.eq('status', statusFilter);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as Bill[];
  },

  async getUnpaidCount(): Promise<number> {
    const { count, error } = await db()
      .from('bills')
      .select('id', { count: 'exact', head: true })
      .in('status', ['unpaid', 'overdue']);
    if (error) throw error;
    return count || 0;
  },

  async create(payload: CreateBillDTO, userId: string): Promise<Bill> {
    const { data, error } = await db()
      .from('bills')
      .insert({ ...payload, user_id: userId, status: 'unpaid' })
      .select()
      .single();
    if (error) throw error;
    return data as Bill;
  },

  async update(id: string, payload: Partial<CreateBillDTO>): Promise<Bill> {
    const { data, error } = await db().from('bills').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Bill;
  },

  async markPaid(id: string): Promise<void> {
    const { error } = await db().from('bills').update({ status: 'paid' }).eq('id', id);
    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('bills').delete().eq('id', id);
    if (error) throw error;
  },

  // PayLater bills
  async getPayLaterBills(options: { statusFilter?: string; limit?: number } = {}): Promise<PayLaterBill[]> {
    let q = db()
      .from('paylater_bills')
      .select('*, wallets(name,icon,provider)')
      .order('due_date', { ascending: true });
    if (options.statusFilter && options.statusFilter !== 'all') {
      q = q.eq('status', options.statusFilter);
    }
    if (options.limit) q = q.limit(options.limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as PayLaterBill[];
  },
};
