// ============================================
// Transaction Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/lib/services/transaction-service';
import { toast } from '@/components/ui/toaster';
import type { TransactionFilters, CreateTransactionDTO, UpdateTransactionDTO, Transaction } from '@/types';

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
      qc.invalidateQueries({ queryKey: ['goals'] });
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
      qc.invalidateQueries({ queryKey: ['goals'] });
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
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Transaksi berhasil dihapus');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
