// ============================================
// PayLater Engine — Installment Generator
// Ported from paylater.js generatePayLaterInstallments()
// ============================================

import { createClient } from '@/lib/supabase/client';
import type { Wallet, Transaction } from '@/types';
import { calculateBilling, getNextBillingCycle, getPayLaterProvider } from './billing-cycle';

export async function generatePayLaterInstallments(
  txn: Transaction,
  tenor: number,
  wallet: Wallet,
  userId: string
) {
  const db = createClient();
  const provider = getPayLaterProvider(wallet);
  const totalAmount = Number(txn.amount);
  const amountPerInstallment = Math.round(totalAmount / tenor);
  const groupId = txn.paylater_bill_group_id || `ig_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  let firstBill = null;
  const firstCycle = calculateBilling(txn.date, wallet);
  const baseCycle = {
    periodStart: firstCycle.periodStart,
    periodEnd: firstCycle.periodEnd,
    billingDate: firstCycle.billingDate,
    dueDate: firstCycle.dueDate,
  };

  for (let i = 1; i <= tenor; i++) {
    const cycle = i === 1 ? firstCycle : getNextBillingCycle(baseCycle, i - 1, provider, wallet);
    const { billingDate, dueDate, periodStart, periodEnd } = cycle;

    const { data: existing } = await db
      .from('paylater_bills')
      .select('*')
      .eq('wallet_id', wallet.id)
      .eq('billing_date', billingDate)
      .eq('provider', provider!)
      .in('status', ['unpaid', 'partial'])
      .limit(1);

    let billId: string;

    if (existing && existing.length > 0) {
      const ext = existing[0];
      const extTotal = Number(ext.total_amount || ext.amount || 0);
      const newTotal = extTotal + amountPerInstallment;
      const newPaid = Number(ext.paid_amount || 0);
      const newRemaining = Math.max(0, newTotal - newPaid);
      const newStatus = newPaid >= newTotal ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

      const { data: updated, error: updateErr } = await db
        .from('paylater_bills')
        .update({
          amount: newTotal,
          total_amount: newTotal,
          remaining_amount: newRemaining,
          status: newStatus,
        })
        .eq('id', ext.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      billId = ext.id;
      if (i === 1) firstBill = updated;
    } else {
      const billPayload = {
        user_id: userId,
        wallet_id: wallet.id,
        provider: provider!,
        amount: amountPerInstallment,
        total_amount: amountPerInstallment,
        remaining_amount: amountPerInstallment,
        billing_date: billingDate,
        due_date: dueDate,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'unpaid' as const,
        paid_amount: 0,
        installment_group_id: groupId,
      };

      const { data: created, error: createErr } = await db
        .from('paylater_bills')
        .insert(billPayload)
        .select()
        .single();

      if (createErr) throw createErr;
      billId = created.id;
      if (i === 1) firstBill = created;
    }

    const { error: itemErr } = await db.from('paylater_bill_items').insert({
      bill_id: billId,
      transaction_id: txn.id,
      installment_number: i,
      installment_total: tenor,
      amount: amountPerInstallment,
    });
    if (itemErr) throw itemErr;
  }

  return firstBill;
}

export async function generatePayLaterBill(txn: Transaction, wallet: Wallet, userId: string) {
  return generatePayLaterInstallments(txn, 1, wallet, userId);
}
