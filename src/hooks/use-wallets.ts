// ============================================
// Wallet Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/lib/services/wallet-service';
import { toast } from '@/components/ui/toaster';
import type { CreateWalletDTO, UpdateWalletDTO, WalletTransferDTO } from '@/types';

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
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['wallets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Transfer berhasil');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
