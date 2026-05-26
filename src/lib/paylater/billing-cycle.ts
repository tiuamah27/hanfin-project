// ============================================
// PayLater Engine — Billing Cycle Calculator
// Pure functions, no DB calls
// Ported from paylater.js
// ============================================

import type { BillingConfig, BillingCycleInfo, Wallet, PayLaterProvider } from '@/types';
import { PAYLATER_BILLING_CONFIGS, PAYLATER_PROVIDERS } from './constants';

// ---- Detection ----

export function isPayLaterWallet(wallet: Wallet | null | undefined): boolean {
  if (!wallet) return false;
  return (
    (wallet.wallet_category === 'liability' || wallet.type === 'liability') &&
    !!wallet.provider &&
    wallet.provider !== 'other'
  );
}

export function getPayLaterProvider(wallet: Wallet | null | undefined): PayLaterProvider | null {
  return (wallet?.provider as PayLaterProvider) || null;
}

export function getProviderInfo(providerKey: string | null) {
  if (!providerKey) return PAYLATER_PROVIDERS.other;
  return PAYLATER_PROVIDERS[providerKey as PayLaterProvider] || PAYLATER_PROVIDERS.other;
}

// ---- Billing Config ----

export function getBillingConfig(
  providerKey: string | null,
  walletOrOptions: Partial<Pick<Wallet, 'billing_cutoff_day' | 'billing_due_offset_days'>> = {}
): BillingConfig {
  const base = PAYLATER_BILLING_CONFIGS[providerKey || 'default'] || PAYLATER_BILLING_CONFIGS.default;
  const config = { ...base };

  const customCutoff = Number(walletOrOptions.billing_cutoff_day);
  const customOffset = Number(walletOrOptions.billing_due_offset_days);

  if (customCutoff >= 1 && customCutoff <= 31) {
    config.cutoffDay = customCutoff;
    config.startDay = customCutoff >= 31 ? 1 : customCutoff + 1;
  }

  if (!Number.isNaN(customOffset) && customOffset > 0) {
    config.dueOffsetDays = customOffset;
  }

  return config;
}

// ---- Date Helpers ----

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

function fmtDate(yr: number, mn: number, dy: number): string {
  const maxDays = new Date(yr, mn, 0).getDate();
  return `${yr}-${pad(mn)}-${pad(Math.min(dy, maxDays))}`;
}

// ---- Main Billing Cycle Calculator ----

export function getBillingCycleInfo(
  dateStr: string,
  providerKey: string | null,
  walletOrOptions: Partial<Pick<Wallet, 'billing_cutoff_day' | 'billing_due_offset_days'>> = {}
): BillingCycleInfo {
  const [y, m, d] = dateStr.split('-').map(Number);
  const config = getBillingConfig(providerKey, walletOrOptions);

  const cutoff = config.cutoffDay;
  const startDay = config.startDay;

  let pStartMonth: number, pStartYear: number, pEndMonth: number, pEndYear: number;

  if (d <= cutoff) {
    const prevM = new Date(y, m - 2, 1);
    pStartYear = prevM.getFullYear();
    pStartMonth = prevM.getMonth() + 1;
    pEndYear = y;
    pEndMonth = m;
  } else {
    pStartYear = y;
    pStartMonth = m;
    const nextM = new Date(y, m, 1);
    pEndYear = nextM.getFullYear();
    pEndMonth = nextM.getMonth() + 1;
  }

  const periodEnd = fmtDate(pEndYear, pEndMonth, cutoff);
  const billingDate = fmtDate(pStartYear, pStartMonth, startDay);
  const dueBaseMonth = new Date(pEndYear, pEndMonth - 1 + config.dueMonthOffset, 1);
  const dueDate =
    config.dueOffsetDays != null
      ? addDays(periodEnd, config.dueOffsetDays)
      : fmtDate(dueBaseMonth.getFullYear(), dueBaseMonth.getMonth() + 1, config.dueDay);

  return {
    period_start: fmtDate(pStartYear, pStartMonth, startDay),
    period_end: periodEnd,
    billing_date: billingDate,
    due_date: dueDate,
  };
}

export function calculateBilling(txnDateStr: string, wallet: Wallet) {
  const provider = getPayLaterProvider(wallet);
  const cycle = getBillingCycleInfo(txnDateStr, provider, wallet);
  return {
    billingDate: cycle.billing_date,
    dueDate: cycle.due_date,
    periodStart: cycle.period_start,
    periodEnd: cycle.period_end,
    provider,
  };
}

export function getNextBillingCycle(
  baseCycle: { periodStart: string; periodEnd: string; billingDate: string; dueDate: string },
  n: number,
  providerKey: string | null,
  walletOrOptions: Partial<Pick<Wallet, 'billing_cutoff_day' | 'billing_due_offset_days'>> = {}
) {
  if (n === 0) return baseCycle;

  const [baseY, baseM] = baseCycle.periodStart.split('-').map(Number);
  const config = getBillingConfig(providerKey, walletOrOptions);
  const cutoff = config.cutoffDay;
  const startDay = config.startDay;

  const newStart = new Date(baseY, baseM - 1 + n, 1);
  const sY = newStart.getFullYear();
  const sM = newStart.getMonth() + 1;

  const newEnd = new Date(sY, sM, 1);
  const eY = newEnd.getFullYear();
  const eM = newEnd.getMonth() + 1;

  const periodEnd = fmtDate(eY, eM, cutoff);
  const dueBaseMonth = new Date(eY, eM - 1 + config.dueMonthOffset, 1);
  const dueDate =
    config.dueOffsetDays != null
      ? addDays(periodEnd, config.dueOffsetDays)
      : fmtDate(dueBaseMonth.getFullYear(), dueBaseMonth.getMonth() + 1, config.dueDay);

  return {
    periodStart: fmtDate(sY, sM, startDay),
    periodEnd,
    billingDate: fmtDate(sY, sM, startDay),
    dueDate,
  };
}
