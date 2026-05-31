// ============================================
// Bill & PayLater Types
// ============================================

import type { Wallet } from './wallet.types';

export type BillStatus = 'unpaid' | 'paid' | 'overdue';

export type PayLaterBillStatus = 'unpaid' | 'partial' | 'paid';

export type PayLaterProvider = 'gopay_later' | 'shopee_paylater' | 'other';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  status: BillStatus;
  is_recurring: boolean;
  recurrence_type: RecurrenceType | null;
  category_id: string | null;
  wallet_id: string | null;
  budget_item_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface PayLaterBill {
  id: string;
  user_id: string;
  wallet_id: string;
  provider: PayLaterProvider;
  amount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  billing_date: string;
  due_date: string;
  period_start: string | null;
  period_end: string | null;
  status: PayLaterBillStatus;
  installment_group_id: string | null;
  created_at: string;
  // Joined relations
  wallets?: Pick<Wallet, 'name' | 'icon' | 'provider'> | null;
}

export interface PayLaterBillItem {
  id: string;
  bill_id: string;
  transaction_id: string;
  installment_number: number;
  installment_total: number;
  amount: number;
}

export interface CreateBillDTO {
  name: string;
  amount: number;
  due_date: string;
  is_recurring?: boolean;
  recurrence_type?: RecurrenceType;
  category_id?: string;
  wallet_id?: string;
  budget_item_id?: string | null;
  notes?: string;
}

export interface BillFilters {
  status?: BillStatus | 'all';
}

export interface BillingConfig {
  cutoffDay: number;
  startDay: number;
  dueDay: number;
  dueMonthOffset: number;
  dueOffsetDays?: number;
}

export interface BillingCycleInfo {
  period_start: string;
  period_end: string;
  billing_date: string;
  due_date: string;
}

export interface CreditLimitCheck {
  allowed: boolean;
  remaining: number;
  totalLimit: number;
  usedLimit: number;
  overage: number;
}

export interface ProviderInfo {
  label: string;
  icon: string;
  defaultOffset?: number;
  defaultCutoff?: number;
}
