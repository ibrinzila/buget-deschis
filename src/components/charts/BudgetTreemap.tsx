'use client';

import { useState } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import type { BudgetSector } from '@/lib/types';

interface Props {
  sectors: BudgetSector[];
  dataKey: 'approved' | 'revised' | 'actual';
  locale?: string;
}

interface NodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  depth?: number;
  color?: string;
  pct?: number;
  root?: boolean;
}

function TreemapContent(props: NodeProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = '', color = '#3b82f6', pct = 0, depth = 0 } = props;

  if (depth === 0 || width < 10 || height < 10) return null;

  const showLabel = width > 75 && height > 45;
  const showPct = width > 100 && height > 65;

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={width - 2}
        height={height - 2}
        rx={4}
        fill={color}
        fillOpacity={0.87}
        stroke="white"
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showPct ? 10 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={Math.min(13, Math.max(9, width / 9))}
          fontWeight="600"
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {name.length > 16 ? name.slice(0, 14) + '…' : name}
        </text>
      )}
      {showPct && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.82)"
          fontSize={Math.min(11, Math.max(9, width / 12))}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          {pct.toFixed(1)}%
        </text>
      )}
    </g>
  );
}

interface TooltipEntry {
  name?: string;
  value?: number;
  payload?: BudgetSector & { pct: number; value: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null;
  const sector = payload[0]?.payload;
  if (!sector) return null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 max-w-[260px] z-50">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: sector.color }} />
        <span className="font-semibold text-gray-900 text-sm">{sector.name}</span>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Aprobat</span>
          <span className="font-mono font-medium text-gray-900">
            {(sector.approved / 1000).toFixed(1)} mld.
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Executat</span>
          <span className="font-mono font-medium text-emerald-700">
            {(sector.actual / 1000).toFixed(1)} mld.
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Pondere</span>
          <span className="font-mono font-medium text-blue-700">
            {sector.pct?.toFixed(1) ?? '—'}%
          </span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-gray-500">Execuție</span>
          <span className="font-mono font-medium">
            {((sector.actual / sector.approved) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function BudgetTreemap({ sectors, dataKey }: Props) {
  const total = sectors.reduce((acc, s) => acc + s[dataKey], 0);
  const data = sectors.map((s) => ({
    ...s,
    value: s[dataKey],
    pct: (s[dataKey] / total) * 100,
  }));

  return (
    <div className="w-full h-[420px] sm:h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<TreemapContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
