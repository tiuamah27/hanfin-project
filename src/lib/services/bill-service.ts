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
      if (statusFilter === 'unpaid') {
        q = q.neq('status', 'paid');
      } else if (statusFilter === 'overdue') {
        q = q.neq('status', 'paid').lt('due_date', new Date().toISOString().split('T')[0]);
      } else {
        q = q.eq('status', statusFilter);
      }
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
    const { data: bill } = await db().from('bills').select('*').eq('id', id).single();
    if (!bill) throw new Error("Tagihan tidak ditemukan");

    const { error } = await db().from('bills').update({ status: 'paid' }).eq('id', id);
    if (error) throw error;

    // Recurring Logic
    if (bill.is_recurring && bill.due_date) {
      const currentDue = new Date(bill.due_date);
      const nextDue = new Date(currentDue);
      
      const rType = bill.recurrence_type || 'monthly';
      if (rType === 'daily') {
        nextDue.setDate(nextDue.getDate() + 1);
      } else if (rType === 'weekly') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (rType === 'yearly') {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      } else {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }

      const { error: insertError } = await db().from('bills').insert({
        user_id: bill.user_id,
        name: bill.name,
        amount: bill.amount,
        due_date: nextDue.toISOString().split('T')[0],
        is_recurring: true,
        recurrence_type: bill.recurrence_type,
        category_id: bill.category_id,
        wallet_id: bill.wallet_id,
        budget_item_id: bill.budget_item_id,
        notes: bill.notes,
        status: 'unpaid'
      });
      if (insertError) console.error("Gagal membuat tagihan berulang:", insertError);
    }
  },



  // PayLater bills
  async getPayLaterBills(options: { statusFilter?: string; limit?: number } = {}): Promise<PayLaterBill[]> {
    let q = db()
      .from('paylater_bills')
      .select('*, wallets(name,icon,provider), paylater_bill_items(*, transactions(*))')
      .order('due_date', { ascending: true });
    if (options.statusFilter && options.statusFilter !== 'all') {
      if (options.statusFilter === 'unpaid') {
        q = q.neq('status', 'paid');
      } else if (options.statusFilter === 'overdue') {
        q = q.neq('status', 'paid').lt('due_date', new Date().toISOString().split('T')[0]);
      } else {
        q = q.eq('status', options.statusFilter);
      }
    }
    if (options.limit) {
      q = q.limit(options.limit);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as PayLaterBill[];
  },

  async payPaylaterBill(id: string, payAmount: number): Promise<void> {
    const { data: bill } = await db().from('paylater_bills').select('*').eq('id', id).single();
    if (!bill) throw new Error("Tagihan PayLater tidak ditemukan");

    const newPaidAmount = (bill.paid_amount || 0) + payAmount;
    const newStatus = newPaidAmount >= bill.amount ? 'paid' : 'partial';

    const { error } = await db().from('paylater_bills').update({
      paid_amount: newPaidAmount,
      status: newStatus
    }).eq('id', id);

    if (error) throw error;
  }
};
