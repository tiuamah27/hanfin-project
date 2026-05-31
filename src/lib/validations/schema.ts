import { z } from 'zod';

export const TransactionBaseSchema = z.object({
  wallet_id: z.string().uuid("Wallet ID tidak valid"),
  category_id: z.string().uuid("Kategori tidak valid").optional().nullable(),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive("Nominal harus lebih besar dari 0"),
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Format tanggal tidak valid" }),
  description: z.string().min(3, "Deskripsi minimal 3 karakter").max(255).optional(),
  notes: z.string().max(500).optional().nullable(),
  budget_item_id: z.string().uuid().optional().nullable(),
  is_split: z.boolean().optional(),
  split_percentage_payer: z.number().min(0).max(100).optional().nullable(),
  split_percentage_other: z.number().min(0).max(100).optional().nullable(),
  installment_total_month: z.number().int().min(1).max(36).optional(),
  paylater_bill_group_id: z.string().optional().nullable(),
  goal_id: z.string().uuid().optional().nullable(),
});

export const TransactionSchema = TransactionBaseSchema.refine(data => {
  if (data.is_split) {
    const payer = data.split_percentage_payer || 0;
    const other = data.split_percentage_other || 0;
    return payer + other === 100;
  }
  return true;
}, {
  message: "Total persentase split harus 100%",
  path: ["split_percentage_payer"]
});

export const UpdateTransactionSchema = TransactionBaseSchema.partial().extend({
  id: z.string().uuid("Transaction ID tidak valid"),
});
