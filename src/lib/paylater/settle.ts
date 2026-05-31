// ============================================
// PayLater Engine — Settle Bill
// Ported from paylater.js settlePayLaterBill()
// ============================================

import { createClient } from '@/lib/supabase/client';
import { getProviderInfo } from './billing-cycle';
import { formatDateShort, todayISO } from '@/lib/utils/formatters';


async function updateUsedLimit(walletId: string, deltaAmount: number) {
  const db = createClient();
  const { data: w, error: fetchErr } = await db
    .from('wallets')
    .select('used_limit,total_limit')
    .eq('id', walletId)
    .single();
  if (fetchErr) throw fetchErr;
  if (!w) return;
  const newUsed = Math.max(0, Number(w.used_limit || 0) + deltaAmount);
  const { error } = await db.from('wallets').update({ used_limit: newUsed }).eq('id', walletId);
  if (error) throw error;
}

async function getOrCreatePayLaterPaymentCategoryId(userId: string): Promise<string> {
  const db = createClient();
  const name = 'Bayar PayLater';
  const { data: existing, error: findErr } = await db
    .from('categories')
    .select('id')
    .eq('name', name)
    .eq('type', 'expense')
    .limit(1);

  if (findErr) throw findErr;
  if (existing && existing.length > 0) return existing[0].id;

  const { data: created, error: createErr } = await db
    .from('categories')
    .insert({ name, type: 'expense', icon: '💳', is_default: true, user_id: userId })
    .select('id')
    .single();

  if (createErr) throw createErr;
  return created?.id || '';
}

export async function settlePayLaterBill(
  billId: string,
  payWalletId: string,
  payAmount: number,
  userId: string
) {
  const db = createClient();
  if (!payWalletId) throw new Error('Pilih wallet pembayaran');
  if (!payAmount || payAmount <= 0) throw new Error('Jumlah pembayaran tidak valid');

  const { data: bill, error: billErr } = await db
    .from('paylater_bills')
    .select('*')
    .eq('id', billId)
    .single();
  if (billErr) throw billErr;
  if (!bill) throw new Error('Tagihan tidak ditemukan');

  const total = Number(bill.total_amount || bill.amount || 0);
  const paid = Number(bill.paid_amount || 0);
  const remaining = Math.max(0, total - paid);
  const actualPay = Math.min(payAmount, remaining);
  if (actualPay <= 0) throw new Error('Tagihan sudah lunas');

  const { data: payWallet, error: walletErr } = await db
    .from('wallets')
    .select('balance,wallet_category,type')
    .eq('id', payWalletId)
    .single();
  if (walletErr) throw walletErr;
  if (!payWallet) throw new Error('Wallet pembayaran tidak ditemukan');
  if ((payWallet.wallet_category || payWallet.type) === 'liability') {
    throw new Error('Pembayaran tidak bisa memakai wallet liability');
  }
  if (Number(payWallet.balance || 0) < actualPay) {
    throw new Error('Saldo wallet pembayaran tidak cukup');
  }

  const categoryId = await getOrCreatePayLaterPaymentCategoryId(userId);

  const newPaid = paid + actualPay;
  const newRemaining = Math.max(0, total - newPaid);
  const newStatus = newPaid >= total ? 'paid' : 'partial';

  const { error: updateErr } = await db
    .from('paylater_bills')
    .update({
      amount: total,
      total_amount: total,
      paid_amount: newPaid,
      remaining_amount: newRemaining,
      status: newStatus,
    })
    .eq('id', billId);
  if (updateErr) throw updateErr;

  // Wallet balance deduction is handled by Supabase trigger
  // when the transaction is inserted below

  if (bill.wallet_id) {
    await updateUsedLimit(bill.wallet_id, -actualPay);
  }

  const provInfo = getProviderInfo(bill.provider);
  const { error: txnErr } = await db.from('transactions').insert({
    user_id: userId,
    wallet_id: payWalletId,
    category_id: categoryId,
    type: 'expense',
    amount: actualPay,
    description: `Bayar ${provInfo.label}: Tagihan ${formatDateShort(bill.billing_date)}`,
    date: todayISO(),
  });
  if (txnErr) throw txnErr;

  return { newStatus, newPaid, actualPay };
}
