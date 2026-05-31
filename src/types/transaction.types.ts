// ============================================
// Transaction Types
// ============================================

export type TransactionType = 'income' | 'expense';

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
  budget_item_id: string | null;
  is_split: boolean;
  split_percentage_payer: number | null;
  split_percentage_other: number | null;
  is_transfer?: boolean;
  transfer_pair_id?: string | null;
  installment_total_month: number;
  paylater_bill_group_id: string | null;
  created_at: string;
  // Joined relations
  categories?: import('./goal-budget.types').Category | null;
  wallets?: Pick<import('./wallet.types').Wallet, 'name' | 'icon'> | null;
  profiles?: Pick<import('./user.types').Profile, 'name' | 'avatar_url'> | null;
}

export interface CreateTransactionDTO {
  wallet_id: string;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  notes?: string;
  budget_item_id?: string | null;
  is_split?: boolean;
  split_percentage_payer?: number;
  split_percentage_other?: number;
  installment_total_month?: number;
  paylater_bill_group_id?: string;
  goal_id?: string | null;
}

export interface UpdateTransactionDTO extends Partial<CreateTransactionDTO> {
  id: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  categoryId?: string;
  search?: string;
  walletId?: string;
}

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
