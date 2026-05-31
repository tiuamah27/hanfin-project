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
  // Use Math.floor to ensure base installments are predictable
  // and the final installment absorbs all remaining cents
  const amountPerInstallment = Math.floor(totalAmount / tenor);
  // Last installment gets remainder to prevent rounding loss
  // e.g., 100000 / 3 = 33333 * 2 + 33334 = 100000
  const groupId = txn.paylater_bill_group_id || `ig_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  let firstBill = null;
  const firstCycle = calculateBilling(txn.date, wallet);
  const baseCycle = {
    periodStart: firstCycle.periodStart,
    periodEnd: firstCycle.periodEnd,
    billingDate: firstCycle.billingDate,
    dueDate: firstCycle.dueDate,
  };

  // Phase 1: Pre-calculate all installments and cycles
  const installments = [];
  const billingDates = [];
  
  for (let i = 1; i <= tenor; i++) {
    const cycle = i === 1 ? firstCycle : getNextBillingCycle(baseCycle, i - 1, provider, wallet);
    const installmentAmount = (i === tenor)
      ? totalAmount - (amountPerInstallment * (tenor - 1))
      : amountPerInstallment;
      
    installments.push({
      i,
      cycle,
      installmentAmount,
    });
    billingDates.push(cycle.billingDate);
  }

  // Phase 2: Fetch all potentially existing bills at once
  const { data: existingBills } = await db
    .from('paylater_bills')
    .select('*')
    .eq('wallet_id', wallet.id)
    .eq('provider', provider!)
    .in('status', ['unpaid', 'partial'])
    .in('billing_date', billingDates);

  const existingMap = new Map((existingBills || []).map(b => [b.billing_date, b]));
  
  const billsToInsert: any[] = [];
  const billsToUpdate: any[] = [];
  const billItemPayloads: any[] = [];

  // Phase 3: Segregate inserts and updates
  for (const { i, cycle, installmentAmount } of installments) {
    const { billingDate, dueDate, periodStart, periodEnd } = cycle;
    const existing = existingMap.get(billingDate);

    if (existing) {
      const extTotal = Number(existing.total_amount || existing.amount || 0);
      const newTotal = extTotal + installmentAmount;
      const newPaid = Number(existing.paid_amount || 0);
      const newRemaining = Math.max(0, newTotal - newPaid);
      const newStatus = newPaid >= newTotal ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

      billsToUpdate.push({
        id: existing.id,
        payload: {
          amount: newTotal,
          total_amount: newTotal,
          remaining_amount: newRemaining,
          status: newStatus,
        },
        i,
        installmentAmount
      });
    } else {
      billsToInsert.push({
        user_id: userId,
        wallet_id: wallet.id,
        provider: provider!,
        amount: installmentAmount,
        total_amount: installmentAmount,
        remaining_amount: installmentAmount,
        billing_date: billingDate,
        due_date: dueDate,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'unpaid' as const,
        paid_amount: 0,
        installment_group_id: groupId,
        _i: i // Temp marker
      });
    }
  }

  // Phase 4: Execute updates (Promise.all)
  if (billsToUpdate.length > 0) {
    await Promise.all(billsToUpdate.map(async (bu) => {
      const { data: updated, error: updateErr } = await db
        .from('paylater_bills')
        .update(bu.payload)
        .eq('id', bu.id)
        .select()
        .single();
        
      if (updateErr) throw updateErr;
      if (bu.i === 1) firstBill = updated;
      
      billItemPayloads.push({
        bill_id: bu.id,
        transaction_id: txn.id,
        installment_number: bu.i,
        installment_total: tenor,
        amount: bu.installmentAmount,
      });
    }));
  }

  // Phase 5: Execute inserts in bulk
  if (billsToInsert.length > 0) {
    const { data: createdBills, error: createErr } = await db
      .from('paylater_bills')
      .insert(billsToInsert.map(b => {
        const { _i, ...rest } = b;
        return rest;
      }))
      .select();
      
    if (createErr) throw createErr;
    
    // Map created bills back to their items
    createdBills.forEach(created => {
      const originalPayload = billsToInsert.find(b => b.billing_date === created.billing_date);
      if (!originalPayload) return;
      
      if (originalPayload._i === 1) firstBill = created;
      
      billItemPayloads.push({
        bill_id: created.id,
        transaction_id: txn.id,
        installment_number: originalPayload._i,
        installment_total: tenor,
        amount: originalPayload.amount,
      });
    });
  }

  // Phase 6: Bulk insert all bill items
  if (billItemPayloads.length > 0) {
    const { error: itemErr } = await db.from('paylater_bill_items').insert(billItemPayloads);
    if (itemErr) throw itemErr;
  }

  return firstBill;
}


