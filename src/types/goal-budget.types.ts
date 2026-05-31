// ============================================
// Goal, Budget & Category Types
// ============================================

import type { TransactionType } from './transaction.types';

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

export interface BudgetItem {
  id: string;
  user_id: string;
  budget_group_id: string | null;
  category_id: string | null;
  name: string;
  amount: number;
  budget_type: 'variable' | 'fixed' | 'goal' | 'sinking' | null;
  priority: 'wajib' | 'penting' | 'fleksibel' | null;
  notes: string | null;
  created_at: string;
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
