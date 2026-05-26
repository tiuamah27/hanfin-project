// ============================================
// HanFin Project — TypeScript Database Types
// Matches existing Supabase schema exactly
// ============================================

export type WalletCategory =
  | 'cash'
  | 'bank'
  | 'ewallet'
  | 'savings'
  | 'budget'
  | 'investment'
  | 'liability';

export type TransactionType = 'income' | 'expense';

export type BillStatus = 'unpaid' | 'paid' | 'overdue';

export type PayLaterBillStatus = 'unpaid' | 'partial' | 'paid';

export type PayLaterProvider = 'gopay_later' | 'shopee_paylater' | 'other';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ProfileRole = 'husband' | 'wife' | 'member';

// ---- Database Row Types ----

export interface Profile {
  id: string;
  name: string;
  role: ProfileRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  wallet_category: WalletCategory;
  type?: string; // legacy field
  balance: number;
  provider: string | null;
  total_limit: number | null;
  used_limit: number | null;
  billing_cutoff_day: number | null;
  billing_due_offset_days: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  notes: string | null;
  is_split: boolean;
  split_percentage_payer: number | null;
  split_percentage_other: number | null;
  is_transfer?: boolean;
  transfer_pair_id?: string | null;
  installment_total_month: number;
  paylater_bill_group_id: string | null;
  created_at: string;
  // Joined relations
  categories?: Category | null;
  wallets?: Pick<Wallet, 'name' | 'icon'> | null;
  profiles?: Pick<Profile, 'name'> | null;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string | null;
  is_default?: boolean;
  budget_group_id?: string | null;
  user_id?: string;
}

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

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  wallet_id: string | null;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  budget_group_id: string | null;
  amount: number;
  period: string; // YYYY-MM
  created_at: string;
  // Joined
  categories?: Category | null;
  budget_groups?: BudgetGroup | null;
}

export interface BudgetGroup {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  amount?: number;
  is_recurring?: boolean;
  notes?: string | null;
  category_ids?: string[];
  created_at: string;
}

export interface WalletTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  admin_fee: number;
  date: string;
  notes: string | null;
  created_at: string;
  // Joined
  from_wallet?: Pick<Wallet, 'name' | 'icon'> | null;
  to_wallet?: Pick<Wallet, 'name' | 'icon'> | null;
}

// ---- DTOs (Data Transfer Objects) ----

export interface CreateTransactionDTO {
  wallet_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  notes?: string;
  is_split?: boolean;
  split_percentage_payer?: number;
  split_percentage_other?: number;
  installment_total_month?: number;
  paylater_bill_group_id?: string;
}

export interface UpdateTransactionDTO extends Partial<CreateTransactionDTO> {
  id: string;
}

export interface CreateWalletDTO {
  name: string;
  icon: string;
  wallet_category: WalletCategory;
  balance?: number;
  provider?: string;
  total_limit?: number;
  billing_cutoff_day?: number;
  billing_due_offset_days?: number;
}

export interface UpdateWalletDTO extends Partial<CreateWalletDTO> {
  id: string;
}

export interface CreateBillDTO {
  name: string;
  amount: number;
  due_date: string;
  is_recurring?: boolean;
  recurrence_type?: RecurrenceType;
  category_id?: string;
  wallet_id?: string;
  notes?: string;
}

export interface CreateGoalDTO {
  name: string;
  icon: string;
  target_amount: number;
  deadline?: string;
  wallet_id?: string;
}

export interface CreateBudgetDTO {
  category_id?: string;
  budget_group_id?: string;
  amount: number;
  period: string;
}

export interface WalletTransferDTO {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  admin_fee?: number;
  date?: string;
  notes?: string;
}

// ---- Billing Cycle Types ----

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

// ---- Filter Types ----

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  walletId?: string;
}

export interface BillFilters {
  status?: BillStatus | 'all';
}

// ---- Dashboard Types ----

export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  prevIncome: number;
  prevExpense: number;
  prevSavings: number;
  incomePctChange: number;
  expensePctChange: number;
}

// ---- Provider / Category Info ----

export interface ProviderInfo {
  label: string;
  icon: string;
  defaultOffset?: number;
  defaultCutoff?: number;
}

export interface WalletCategoryInfo {
  label: string;
  icon: string;
  color: string;
}
