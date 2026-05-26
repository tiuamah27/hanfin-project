// ============================================
// Goal Service + Budget Service + Category Service
// ============================================

import { createClient } from '@/lib/supabase/client';
import type { Goal, CreateGoalDTO, Budget, CreateBudgetDTO, BudgetGroup, Category } from '@/types';

const db = () => createClient();

// ---- Goal Service ----
export const goalService = {
  async getAll(): Promise<Goal[]> {
    const { data, error } = await db().from('goals').select('*').order('deadline');
    if (error) throw error;
    return (data || []) as Goal[];
  },

  async getActive(): Promise<Goal[]> {
    const { data, error } = await db()
      .from('goals')
      .select('*')
      .eq('status', 'active')
      .order('deadline');
    if (error) throw error;
    return (data || []) as Goal[];
  },

  async create(payload: CreateGoalDTO, userId: string): Promise<Goal> {
    const { data, error } = await db()
      .from('goals')
      .insert({ ...payload, user_id: userId, current_amount: 0, status: 'active' })
      .select()
      .single();
    if (error) throw error;
    return data as Goal;
  },

  async update(id: string, payload: Partial<CreateGoalDTO & { status: string }>): Promise<Goal> {
    const { data, error } = await db().from('goals').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Goal;
  },

  async contribute(goalId: string, amount: number, walletId: string): Promise<void> {
    const { walletService } = await import('./wallet-service');

    // Update goal current_amount
    const { data: goal, error: gErr } = await db().from('goals').select('current_amount').eq('id', goalId).single();
    if (gErr) throw gErr;
    const newAmount = Number(goal.current_amount || 0) + amount;
    const { error: uErr } = await db().from('goals').update({ current_amount: newAmount }).eq('id', goalId);
    if (uErr) throw uErr;

    // Deduct wallet balance
    await walletService.updateBalance(walletId, -amount);
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('goals').delete().eq('id', id);
    if (error) throw error;
  },
};

// ---- Budget Service ----
export const budgetService = {
  async getByPeriod(period: string): Promise<Budget[]> {
    const { data, error } = await db()
      .from('budgets')
      .select('*, categories(name,icon,color), budget_groups(name,icon,color)')
      .eq('period', period);
    if (error) throw error;
    return (data || []) as Budget[];
  },

  async create(payload: CreateBudgetDTO, userId: string): Promise<Budget> {
    const { data, error } = await db()
      .from('budgets')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Budget;
  },

  async update(id: string, payload: Partial<CreateBudgetDTO>): Promise<Budget> {
    const { data, error } = await db().from('budgets').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data as Budget;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  async getBudgetGroups(): Promise<BudgetGroup[]> {
    const { data, error } = await db().from('budget_groups').select('*').order('name');
    if (error) throw error;
    return (data || []) as BudgetGroup[];
  },

  async createBudgetGroup(payload: { name: string; icon: string; color: string }, userId: string): Promise<BudgetGroup> {
    const { data, error } = await db()
      .from('budget_groups')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as BudgetGroup;
  },
};

// ---- Category Service ----
export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data, error } = await db().from('categories').select('*').order('name');
    if (error) throw error;
    return (data || []) as Category[];
  },

  async getByType(type: 'income' | 'expense'): Promise<Category[]> {
    const { data, error } = await db().from('categories').select('*').eq('type', type).order('name');
    if (error) throw error;
    return (data || []) as Category[];
  },

  async create(payload: { name: string; type: string; icon: string; color?: string }, userId: string): Promise<Category> {
    const { data, error } = await db()
      .from('categories')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as Category;
  },
};
