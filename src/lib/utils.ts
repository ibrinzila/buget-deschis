import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMDL(millions: number, locale = 'ro'): string {
  if (millions >= 1000) {
    const billions = millions / 1000;
    const formatted = new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : locale === 'ru' ? 'ru-RU' : 'en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(billions);
    return locale === 'ru' ? `${formatted} млрд. MDL` : `${formatted} mld. MDL`;
  }
  const formatted = new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : locale === 'ru' ? 'ru-RU' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(millions);
  return `${formatted} mil. MDL`;
}

export function formatNumber(n: number, locale = 'ro'): string {
  return new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : locale === 'ru' ? 'ru-RU' : 'en-US').format(n);
}

export function formatPercent(n: number, locale = 'ro'): string {
  return new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(n / 100);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-blue-100 text-blue-800';
    case 'awarded': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'complete': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getMethodColor(method: string): string {
  switch (method) {
    case 'open': return 'bg-emerald-100 text-emerald-800';
    case 'limited': return 'bg-amber-100 text-amber-800';
    case 'direct': return 'bg-rose-100 text-rose-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
