// ============================================
// PayLater Engine — Constants
// Ported from paylater.js
// ============================================

import type { PayLaterProvider, WalletCategory, BillingConfig, ProviderInfo, WalletCategoryInfo } from '@/types';

export const PAYLATER_PROVIDERS: Record<PayLaterProvider, ProviderInfo> = {
  gopay_later:     { label: 'GoPay Later',     icon: '🟢', defaultOffset: 0 },
  shopee_paylater: { label: 'Shopee PayLater',  icon: '🟠', defaultOffset: 10, defaultCutoff: 25 },
  other:           { label: 'PayLater Lainnya', icon: '💳', defaultOffset: 0 },
};

export const WALLET_CATEGORIES: Record<WalletCategory, WalletCategoryInfo> = {
  cash:       { label: 'Cash',       icon: '💵', color: '#fbbf24' },
  bank:       { label: 'Bank',       icon: '🏦', color: '#34d399' },
  ewallet:    { label: 'E-Wallet',   icon: '📱', color: '#a78bfa' },
  savings:    { label: 'Savings',    icon: '🏗',  color: '#38bdf8' },
  budget:     { label: 'Budget',     icon: '📊', color: '#fb7185' },
  investment: { label: 'Investment', icon: '📈', color: '#818cf8' },
  liability:  { label: 'Liability',  icon: '⚠️', color: '#f87171' },
};

export const PAYLATER_BILLING_CONFIGS: Record<string, BillingConfig> = {
  default:          { cutoffDay: 14, startDay: 15, dueDay: 25, dueMonthOffset: 0 },
  shopee_paylater:  { cutoffDay: 14, startDay: 15, dueDay: 25, dueMonthOffset: 0 },
  gopay_later:      { cutoffDay: 14, startDay: 15, dueDay: 1,  dueMonthOffset: 1 },
};

export const TENOR_OPTIONS = [1, 3, 6, 12] as const;
export type TenorOption = (typeof TENOR_OPTIONS)[number];
