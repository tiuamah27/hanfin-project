// ============================================
// Goal, Budget & Category Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService, budgetService, budgetItemService, categoryService } from '@/lib/services/goal-budget-category-service';
import { toast } from '@/components/ui/toaster';
import type { CreateGoalDTO } from '@/types';

// ---- Goal Hooks ----
export function useGoals() {
  return useQuery({ queryKey: ['goals'], queryFn: () => goalService.getActive() });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: CreateGoalDTO; userId: string }) =>
      goalService.create(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal berhasil dibuat');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useContributeGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { goalId: string; amount: number; walletId: string }) =>
      goalService.contribute(p.goalId, p.amount, p.walletId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Kontribusi berhasil');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Budget Hooks ----

export function useBudgetGroups() {
  return useQuery({
    queryKey: ['budget-groups'],
    queryFn: () => budgetService.getBudgetGroups(),
  });
}

export function useCreateBudgetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: { name: string; icon: string; color: string; amount?: number; is_recurring?: boolean; notes?: string | null; category_ids?: string[] }; userId: string }) =>
      budgetService.createBudgetGroup(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-groups'] });
      toast.success('Budget Group berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBudgetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => budgetService.updateBudgetGroup(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-groups'] });
      toast.success('Budget Group berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudgetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetService.deleteBudgetGroup(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-groups'] });
      toast.success('Budget Group berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBudgetItems(month?: string) {
  return useQuery({
    queryKey: ['budget-items', month],
    queryFn: () => budgetItemService.getAll(),
  });
}

export function useCreateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: any; userId: string }) => budgetItemService.create(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-items'] });
      toast.success('Item berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => budgetItemService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-items'] });
      toast.success('Item berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudgetItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetItemService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budget-items'] });
      toast.success('Item berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Category Hooks ----
export function useCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => (type ? categoryService.getByType(type) : categoryService.getAll()),
  });
}
