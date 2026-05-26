// ============================================
// PayLater Engine — Credit Limit Checker
// Pure functions ported from paylater.js
// ============================================

import type { Wallet, CreditLimitCheck } from '@/types';

export function getRemainingLimit(wallet: Wallet): number {
  const total = Number(wallet.total_limit || 0);
  const used = Number(wallet.used_limit || 0);
  return Math.max(0, total - used);
}

export function checkCreditLimit(wallet: Wallet, amount: number): CreditLimitCheck {
  const totalLimit = Number(wallet.total_limit || 0);
  if (totalLimit <= 0) return { allowed: true, remaining: Infinity, totalLimit: 0, usedLimit: 0, overage: 0 };
  const remaining = getRemainingLimit(wallet);
  return {
    allowed: amount <= remaining,
    remaining,
    totalLimit,
    usedLimit: Number(wallet.used_limit || 0),
    overage: Math.max(0, amount - remaining),
  };
}
