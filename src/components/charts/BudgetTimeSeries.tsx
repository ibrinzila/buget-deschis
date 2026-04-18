'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BUDGET_TREND } from '@/lib/budget-data';
import { useTranslations } from 'next-intl';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[180px]">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-6 text-sm py-0.5">
          <span className="text-gray-500 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="font-mono font-medium text-gray-900">{entry.value.toFixed(1)} mld.</span>
        </div>
      ))}
    </div>
  );
}

export default function BudgetTimeSeries() {
  const t = useTranslations('budget.trend');

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={BUDGET_TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="gradEU" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}`}
            label={{
              value: t('subtitle'),
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 11, fill: '#9ca3af' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
            formatter={(value) => <span style={{ color: '#374151' }}>{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="approved"
            name={t('approved')}
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#gradApproved)"
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name={t('actual')}
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#gradActual)"
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: 'white' }}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="euFunds"
            name={t('euFunds')}
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#gradEU)"
            strokeDasharray="5 3"
            dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
