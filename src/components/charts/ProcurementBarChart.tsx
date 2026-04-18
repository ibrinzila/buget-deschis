'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { PROCUREMENT_BY_SECTOR } from '@/lib/procurement-data';
import { useTranslations } from 'next-intl';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#6366f1',
  '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#64748b',
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { sector: string; count: number } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
      <p className="font-semibold text-gray-900 mb-1 text-sm">{d.payload.sector}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Volum:</span>
          <span className="font-mono font-medium">{d.value.toLocaleString('ro-MD')} mil. MDL</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Proceduri:</span>
          <span className="font-mono font-medium">{d.payload.count.toLocaleString('ro-MD')}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProcurementBarChart() {
  const t = useTranslations('procurement.chart');
  const data = [...PROCUREMENT_BY_SECTOR].sort((a, b) => b.volume - a.volume);

  return (
    <div className="w-full h-[340px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickFormatter={(v) => `${v.toLocaleString('ro-MD')}`}
          />
          <YAxis
            dataKey="sector"
            type="category"
            tick={{ fontSize: 11, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
            width={115}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
          <Bar dataKey="volume" name={t('volume')} radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
