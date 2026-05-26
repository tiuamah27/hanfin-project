// ============================================
// React Query Hooks — All Domains
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/lib/services/wallet-service';
import { transactionService } from '@/lib/services/transaction-service';
import { billService } from '@/lib/services/bill-service';
import { goalService, budgetService, categoryService } from '@/lib/services/goal-budget-category-service';
import { toast } from '@/components/ui/toaster';
import type { TransactionFilters, CreateTransactionDTO, UpdateTransactionDTO, Transaction, CreateWalletDTO, UpdateWalletDTO, WalletTransferDTO, CreateBillDTO, CreateGoalDTO, CreateBudgetDTO } from '@/types';

// ---- Auth Hook ----
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (u) {
        setUser({ id: u.id, email: u.email });
        const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single();
        if (p) {
          setProfile(p as Profile);
        } else {
          const name = u.email?.split('@')[0] || 'User';
          const { data: newP } = await supabase
            .from('profiles')
            .upsert({ id: u.id, name, role: 'husband' }, { onConflict: 'id' })
            .select('*')
            .single();
          setProfile((newP || { id: u.id, name, role: 'husband' }) as Profile);
        }
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return { user, profile, loading, signOut };
}

// ---- Wallet Hooks ----
export function useWallets() {
  return useQuery({ queryKey: ['wallets'], queryFn: () => walletService.getActive() });
}

export function useAllWallets() {
  return useQuery({ queryKey: ['wallets', 'all'], queryFn: () => walletService.getAll() });
}

export function useCreateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: CreateWalletDTO; userId: string }) =>
      walletService.create(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateWalletDTO) => walletService.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTransferWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: WalletTransferDTO; userId: string }) =>
      walletService.transfer(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transfer berhasil');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Transaction Hooks ----
export function useTransactions(month: string, filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', month, filters],
    queryFn: () => transactionService.getByMonth(month, filters),
  });
}

export function useRecentTransactions(limit: number = 6) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: () => transactionService.getRecent(limit),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: CreateTransactionDTO; userId: string }) =>
      transactionService.create(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaksi berhasil disimpan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, oldTxn }: { payload: UpdateTransactionDTO; oldTxn: Transaction }) =>
      transactionService.update(payload, oldTxn),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaksi berhasil diperbarui');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (txn: Transaction) => transactionService.delete(txn),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaksi berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Bill Hooks ----
export function useBills(statusFilter?: string) {
  return useQuery({
    queryKey: ['bills', statusFilter],
    queryFn: () => billService.getAll(statusFilter),
  });
}

export function usePayLaterBills(options?: { statusFilter?: string; limit?: number }) {
  return useQuery({
    queryKey: ['paylater-bills', options],
    queryFn: () => billService.getPayLaterBills(options),
  });
}

export function useBillsUnpaidCount() {
  return useQuery({
    queryKey: ['bills', 'unpaid-count'],
    queryFn: () => billService.getUnpaidCount(),
    staleTime: 60_000,
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: CreateBillDTO; userId: string }) =>
      billService.create(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Tagihan berhasil ditambahkan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePayBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => billService.markPaid(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Tagihan ditandai lunas');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

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
export function useBudgets(period: string) {
  return useQuery({
    queryKey: ['budgets', period],
    queryFn: () => budgetService.getByPeriod(period),
  });
}

export function useBudgetGroups() {
  return useQuery({ queryKey: ['budget-groups'], queryFn: () => budgetService.getBudgetGroups() });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, userId }: { payload: CreateBudgetDTO; userId: string }) =>
      budgetService.create(payload, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget berhasil disimpan');
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
