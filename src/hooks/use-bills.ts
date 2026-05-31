// ============================================
// Bill & PayLater Hooks
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billService } from '@/lib/services/bill-service';
import { toast } from '@/components/ui/toaster';
import type { CreateBillDTO } from '@/types';

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

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateBillDTO> }) =>
      billService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Tagihan berhasil diperbarui');
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

export function usePayPaylaterBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => billService.payPaylaterBill(id, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paylater-bills'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['wallets'] });
    },
    // We handle toast inside the modal for custom messages, or we can handle error here
  });
}
