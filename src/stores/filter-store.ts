import { create } from 'zustand';
import type { TransactionType, BillStatus } from '@/types';
import { getMonthString } from '@/lib/utils/formatters';

interface FilterStore {
  transactionMonth: string;
  transactionType: TransactionType | 'all';
  transactionCategory: string | 'all';
  transactionSearch: string;
  billsStatus: BillStatus | 'all';
  budgetPeriod: string;
  calendarMonth: string;
  setTransactionMonth: (m: string) => void;
  setTransactionType: (t: TransactionType | 'all') => void;
  setTransactionCategory: (c: string | 'all') => void;
  setTransactionSearch: (s: string) => void;
  setBillsStatus: (s: BillStatus | 'all') => void;
  setBudgetPeriod: (p: string) => void;
  setCalendarMonth: (m: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  transactionMonth: getMonthString(0),
  transactionType: 'all',
  transactionCategory: 'all',
  transactionSearch: '',
  billsStatus: 'unpaid',
  budgetPeriod: getMonthString(0),
  calendarMonth: getMonthString(0),
  setTransactionMonth: (m) => set({ transactionMonth: m }),
  setTransactionType: (t) => set({ transactionType: t }),
  setTransactionCategory: (c) => set({ transactionCategory: c }),
  setTransactionSearch: (s) => set({ transactionSearch: s }),
  setBillsStatus: (s) => set({ billsStatus: s }),
  setBudgetPeriod: (p) => set({ budgetPeriod: p }),
  setCalendarMonth: (m) => set({ calendarMonth: m }),
}));
