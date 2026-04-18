import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'rose';
  className?: string;
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-100 text-blue-700',
  green: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  amber: 'bg-amber-50 border-amber-100 text-amber-700',
  purple: 'bg-violet-50 border-violet-100 text-violet-700',
  rose: 'bg-rose-50 border-rose-100 text-rose-700',
};

const iconBg = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-emerald-100 text-emerald-600',
  amber: 'bg-amber-100 text-amber-600',
  purple: 'bg-violet-100 text-violet-600',
  rose: 'bg-rose-100 text-rose-600',
};

export default function StatCard({
  label,
  value,
  sub,
  icon,
  color = 'blue',
  className,
}: Props) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 flex items-start gap-4',
        colorMap[color],
        className
      )}
    >
      {icon && (
        <div className={cn('p-2.5 rounded-xl flex-shrink-0', iconBg[color])}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
