// ============================================
// HanFin Project — Utility Formatters
// Ported from FinTrack supabase.js
// ============================================

/**
 * Format number as Indonesian Rupiah currency
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

/**
 * Format number as shortened Rupiah (e.g., 1.5M, 500K)
 */
export function formatRupiahShort(amount: number | null | undefined): string {
  if (amount == null) return 'Rp 0';
  let n = Number(amount);
  if (isNaN(n) || n === 0) return 'Rp 0';

  const isNegative = n < 0;
  n = Math.abs(n);

  let result = '';

  if (n >= 1000000) {
    const thousands = Math.floor(n / 1000);
    const formattedThousands = new Intl.NumberFormat('id-ID', { useGrouping: true }).format(thousands);
    result = formattedThousands + 'K';
  } else if (n >= 1000) {
    const val = Math.floor((n / 1000) * 10) / 10;
    if (val % 1 === 0) {
      result = Math.floor(val) + 'K';
    } else {
      result = val.toFixed(1) + 'K';
    }
  } else {
    result = Math.floor(n).toString();
  }

  return (isNegative ? '-Rp ' : 'Rp ') + result;
}

/**
 * Format date string to full Indonesian date (e.g., "25 Mei 2026")
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr + 'T12:00:00'));
  } catch {
    return dateStr;
  }
}

/**
 * Format date string to short format (e.g., "25 Mei")
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(dateStr + 'T12:00:00'));
  } catch {
    return dateStr;
  }
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function todayISO(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/**
 * Get month date range with offset
 * @param offsetMonths - Offset from current month (0 = this month, -1 = last month)
 */
export function getMonthRange(offsetMonths: number = 0): { start: string; end: string } {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offsetMonths);
  const y = d.getFullYear();
  const m = d.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const days = new Date(y, m + 1, 0).getDate();
  return {
    start: `${y}-${pad(m + 1)}-01`,
    end: `${y}-${pad(m + 1)}-${pad(days)}`,
  };
}

/**
 * Get month string for period (YYYY-MM)
 */
export function getMonthString(offsetMonths: number = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate percentage change between two values
 */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Format number with compact notation for charts
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
  return value.toString();
}
