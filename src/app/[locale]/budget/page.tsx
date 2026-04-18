'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  Download,
  TrendingUp,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { BUDGET_DATA, AVAILABLE_YEARS, computeSectorPct } from '@/lib/budget-data';
import BudgetTimeSeries from '@/components/charts/BudgetTimeSeries';
import { formatMDL, formatPercent } from '@/lib/utils';

const BudgetTreemap = dynamic(() => import('@/components/charts/BudgetTreemap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] animate-pulse bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
      <span className="text-gray-400 text-sm">Se încarcă vizualizarea…</span>
    </div>
  ),
});

type DataKey = 'approved' | 'revised' | 'actual';

export default function BudgetPage() {
  const t = useTranslations('budget');
  const locale = useLocale();
  const [year, setYear] = useState(2024);
  const [dataKey, setDataKey] = useState<DataKey>('approved');

  const rawData = BUDGET_DATA[year];
  const data = computeSectorPct(rawData);
  const prevData = year > 2019 ? BUDGET_DATA[year - 1] : null;
  const totalValue = data[`total${dataKey.charAt(0).toUpperCase()}${dataKey.slice(1)}` as 'totalApproved' | 'totalRevised' | 'totalActual'];
  const prevTotalValue = prevData?.totalApproved ?? 0;
  const pctChange = prevData ? ((totalValue - prevTotalValue) / prevTotalValue) * 100 : null;
  const topSector = [...data.sectors].sort((a, b) => b[dataKey] - a[dataKey])[0];

  const sectorNameKey = locale === 'ru' ? 'nameRu' : locale === 'en' ? 'nameEn' : 'name';

  function downloadCSV() {
    const rows = [
      ['Sector', 'Cod', 'Aprobat (mil. MDL)', 'Executat (mil. MDL)', 'Pondere %'],
      ...data.sectors.map((s) => [
        s.name,
        s.code,
        s.approved.toString(),
        s.actual.toString(),
        (s.pct ?? 0).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buget-moldova-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <BarChart3 size={15} />
          <span>Platformă → Buget</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-500 max-w-2xl">{t('subtitle')}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">{t('selectYear')}:</label>
          <div className="flex rounded-xl border border-gray-300 overflow-hidden bg-white">
            {AVAILABLE_YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  y === year
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">{t('viewType.label')}:</label>
          <div className="flex rounded-xl border border-gray-300 overflow-hidden bg-white">
            {(['approved', 'revised', 'actual'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setDataKey(key)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  key === dataKey
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t(`viewType.${key}`)}
              </button>
            ))}
          </div>
        </div>
        <button onClick={downloadCSV} className="btn-secondary ml-auto">
          <Download size={15} />
          {t('download')}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card-padded">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t('summary.total')}
          </p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {(totalValue / 1000).toFixed(1)}
            <span className="text-sm font-normal text-gray-500 ml-1">mld. MDL</span>
          </p>
          {pctChange !== null && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${pctChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {pctChange >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
              {Math.abs(pctChange).toFixed(1)}% {t('summary.vsLastYear')}
            </p>
          )}
        </div>

        <div className="card-padded">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t('summary.execution')}
          </p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">
            {data.executionRate.toFixed(1)}%
          </p>
          <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${data.executionRate}%` }}
            />
          </div>
        </div>

        <div className="card-padded">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t('summary.topSector')}
          </p>
          <p className="text-base font-semibold text-gray-900 leading-tight">
            {topSector[sectorNameKey]}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(topSector.pct ?? 0).toFixed(1)}% • {formatMDL(topSector.approved, locale)}
          </p>
        </div>

        <div className="card-padded">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Sectoare
          </p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{data.sectors.length}</p>
          <p className="text-xs text-gray-500 mt-1">clasificare COFOG</p>
        </div>
      </div>

      {/* Treemap */}
      <div className="card-padded mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t('treemap.title')}</h2>
            <p className="text-sm text-gray-500">{t('treemap.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5">
            <Info size={13} />
            Hover pentru detalii
          </div>
        </div>
        <BudgetTreemap sectors={data.sectors} dataKey={dataKey} locale={locale} />
      </div>

      {/* Time series */}
      <div className="card-padded mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('trend.title')}</h2>
        <p className="text-sm text-gray-500 mb-6">{t('trend.subtitle')}</p>
        <BudgetTimeSeries />
      </div>

      {/* Data table */}
      <div className="card overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('table.title')}</h2>
          <span className="text-xs text-gray-500 bg-gray-100 rounded-lg px-3 py-1.5">
            {year}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-6 py-3">
                  {t('table.sector')}
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  {t('table.approved')}
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  {t('table.actual')}
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  {t('table.execution')}
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  {t('table.share')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...data.sectors]
                .sort((a, b) => b.approved - a.approved)
                .map((sector) => {
                  const execRate = (sector.actual / sector.approved) * 100;
                  return (
                    <tr key={sector.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            style={{ backgroundColor: sector.color }}
                          />
                          <span className="font-medium text-sm text-gray-900">
                            {sector[sectorNameKey]}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">{sector.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-sm text-gray-700">
                        {sector.approved.toLocaleString('ro-MD')}
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-sm text-gray-700">
                        {sector.actual.toLocaleString('ro-MD')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(execRate, 100)}%`,
                                backgroundColor: execRate >= 90 ? '#10b981' : execRate >= 75 ? '#f59e0b' : '#ef4444',
                              }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium tabular-nums ${
                              execRate >= 90 ? 'text-emerald-700' : execRate >= 75 ? 'text-amber-700' : 'text-red-600'
                            }`}
                          >
                            {execRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-sm text-gray-500">
                        {(sector.pct ?? 0).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td className="px-6 py-3 text-sm font-semibold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
                  {data.totalApproved.toLocaleString('ro-MD')}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-gray-900">
                  {data.totalActual.toLocaleString('ro-MD')}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                  {data.executionRate.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-500">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Source */}
      <p className="text-xs text-gray-400 text-center">{t('source')}</p>
    </div>
  );
}
