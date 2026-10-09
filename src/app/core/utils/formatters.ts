const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const currencyWhole = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateShort = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const dateLong = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const trendTick = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});

export function formatCurrency(amount: number): string {
  return currency.format(amount);
}

export function formatCurrencyWhole(amount: number): string {
  return currencyWhole.format(amount);
}

export function formatDate(dateStr: string): string {
  return dateShort.format(new Date(dateStr));
}

export function formatJoinDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return dateLong.format(new Date(dateStr));
}

export function formatTrendDate(dateStr: string): string {
  return trendTick.format(new Date(dateStr));
}

export function formatAxisTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100000) {
    const l = abs / 100000;
    return `₹${l.toFixed(Number.isInteger(l) ? 0 : 1)}L`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    return `₹${k.toFixed(Number.isInteger(k) ? 0 : 1)}k`;
  }
  return `₹${Math.round(value)}`;
}

export function capitalise(str = ''): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank',
};