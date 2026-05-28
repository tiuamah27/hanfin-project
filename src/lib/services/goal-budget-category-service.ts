// ============================================
// Goal Service + Budget Service + Category Service
// ============================================

import { createClient } from '@/lib/supabase/client';
import type { Goal, CreateGoalDTO, Budget, CreateBudgetDTO, BudgetGroup, Category, BudgetItem } from '@/types';

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

  async contribute(goalId: string, amount: number, _walletId: string): Promise<void> {
    // Update goal current_amount
    const { data: goal, error: gErr } = await db().from('goals').select('current_amount').eq('id', goalId).single();
    if (gErr) throw gErr;
    const newAmount = Number(goal.current_amount || 0) + amount;
    const { error: uErr } = await db().from('goals').update({ current_amount: newAmount }).eq('id', goalId);
    if (uErr) throw uErr;

    // Wallet balance deduction is handled by Supabase trigger
    // when the associated transaction is created
  },

  async delete(id: string): Promise<void> {
    const { error } = await db().from('goals').delete().eq('id', id);
    if (error) throw error;
  },
};

// ---- Budget Service ----
export const budgetService = {

  async getBudgetGroups(): Promise<BudgetGroup[]> {
    const { data, error } = await db().from('budget_groups').select('*').order('name');
    if (error) throw error;
    return (data || []) as BudgetGroup[];
  },

  async createBudgetGroup(payload: { name: string; icon: string; color: string; is_recurring?: boolean; notes?: string | null; category_ids?: string[] }, userId: string): Promise<BudgetGroup> {
    const { data: groupData, error: groupError } = await db()
      .from('budget_groups')
      .insert({ 
        name: payload.name, 
        icon: payload.icon, 
        color: payload.color, 
        is_recurring: payload.is_recurring,
        notes: payload.notes,
        user_id: userId 
      })
      .select()
      .single();
    if (groupError) throw groupError;

    // Update selected categories to reference this budget group
    if (payload.category_ids && payload.category_ids.length > 0) {
      const { error: catError } = await db()
        .from('categories')
        .update({ budget_group_id: groupData.id })
        .in('id', payload.category_ids);
      if (catError) console.error("Failed to update category group references:", catError);
    }

    return groupData as BudgetGroup;
  },

  async updateBudgetGroup(id: string, payload: { name?: string; icon?: string; color?: string; is_recurring?: boolean; notes?: string | null; category_ids?: string[] }): Promise<BudgetGroup> {
    const updatePayload: any = { ...payload };
    delete updatePayload.category_ids; // Don't try to save this array to the DB table

    const { data, error } = await db()
      .from('budget_groups')
      .update(updatePayload)
      .eq('id', id)
      .select();
    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error("Gagal menyimpan: Data tidak ditemukan atau terhalang izin akses RLS (Update Policy).");
    }
    
    return data[0] as BudgetGroup;
  },

  async deleteBudgetGroup(id: string): Promise<void> {
    const { error } = await db().from('budget_groups').delete().eq('id', id);
    if (error) throw error;
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

// ---- Budget Item Service ----
export const budgetItemService = {
  async getAll(): Promise<BudgetItem[]> {
    const { data, error } = await db().from('budget_items').select('*').order('name');
    if (error) throw error;
    return (data || []) as BudgetItem[];
  },

  async getByCategory(categoryId: string): Promise<BudgetItem[]> {
    const { data, error } = await db().from('budget_items').select('*').eq('category_id', categoryId).order('name');
    if (error) throw error;
    return (data || []) as BudgetItem[];
  },

  async create(payload: Partial<BudgetItem>, userId: string): Promise<BudgetItem> {
    const { data, error } = await db()
      .from('budget_items')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data as BudgetItem;
  },

  async update(id: string, payload: Partial<BudgetItem>): Promise<BudgetItem> {
    const { data, error } = await db()
      .from('budget_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as BudgetItem;
  },

  async delete(id: string): Promise<void> {
    const { error } = await db()
      .from('budget_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
