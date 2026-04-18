'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Search, X, Filter, ShoppingCart, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import {
  TENDERS,
  PROCUREMENT_STATS,
  PROCUREMENT_SECTORS,
  searchTenders,
} from '@/lib/procurement-data';
import type { Tender } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import { getStatusColor, getMethodColor } from '@/lib/utils';

const ProcurementBarChart = dynamic(() => import('@/components/charts/ProcurementBarChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[340px] animate-pulse bg-gray-100 rounded-xl" />
  ),
});

function StatusBadge({ status }: { status: Tender['status'] }) {
  const t = useTranslations('procurement.status');
  const variantMap: Record<Tender['status'], 'success' | 'info' | 'danger' | 'neutral'> = {
    active: 'info',
    awarded: 'success',
    cancelled: 'danger',
    complete: 'neutral',
  };
  return <Badge variant={variantMap[status]}>{t(status)}</Badge>;
}

function MethodBadge({ method }: { method: Tender['method'] }) {
  const t = useTranslations('procurement.method');
  const variantMap: Record<Tender['method'], 'success' | 'warning' | 'danger'> = {
    open: 'success',
    limited: 'warning',
    direct: 'danger',
  };
  return <Badge variant={variantMap[method]}>{t(method)}</Badge>;
}

function TenderRow({ tender }: { tender: Tender }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        className="hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="font-mono text-xs text-blue-600 hover:underline">{tender.id.split('-').slice(-1)[0]}</div>
        </td>
        <td className="px-4 py-3 max-w-xs">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
            {tender.title}
          </p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-gray-700">{tender.authority}</p>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="text-sm font-mono tabular-nums text-gray-900">
            {(tender.value / 1_000_000).toFixed(2)} mil.
          </span>
        </td>
        <td className="px-4 py-3">
          <MethodBadge method={tender.method} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={tender.status} />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          {tender.publishedDate}
        </td>
        <td className="px-4 py-3 text-center text-sm text-gray-500">
          {tender.bids ?? '—'}
        </td>
        <td className="px-4 py-3">
          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-blue-50/40">
          <td colSpan={9} className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">OCID</p>
                <p className="font-mono text-gray-800 text-xs">{tender.ocid}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Sector</p>
                <p className="text-gray-800">{tender.sector}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Termen limită</p>
                <p className="text-gray-800">{tender.deadlineDate}</p>
              </div>
              {tender.winner && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Câștigător</p>
                  <p className="font-medium text-emerald-700">{tender.winner}</p>
                </div>
              )}
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Valoare exactă</p>
                <p className="font-mono tabular-nums text-gray-800">
                  {tender.value.toLocaleString('ro-MD')} MDL
                </p>
              </div>
            </div>
            <div className="mt-3">
              <a
                href={`https://mtender.gov.md/en/procedures/${tender.ocid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
                Vizualizați pe MTender
              </a>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ProcurementPage() {
  const t = useTranslations('procurement');
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('all');
  const [status, setStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(
    () => searchTenders(query, sector, status),
    [query, sector, status]
  );

  const stats = PROCUREMENT_STATS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <ShoppingCart size={15} />
          <span>Platformă → Achiziții Publice</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-500 max-w-2xl">{t('subtitle')}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
        {[
          { label: t('stats.total'), value: stats.totalProcedures.toLocaleString('ro-MD'), color: 'text-gray-900' },
          { label: t('stats.active'), value: stats.activeTenders.toLocaleString('ro-MD'), color: 'text-blue-700' },
          { label: t('stats.awarded'), value: stats.awardedContracts.toLocaleString('ro-MD'), color: 'text-emerald-700' },
          { label: t('stats.cancelled'), value: stats.cancelledTenders.toLocaleString('ro-MD'), color: 'text-red-600' },
          { label: t('stats.volume'), value: `${(stats.totalVolumeMDL / 1e9).toFixed(1)} mld. MDL`, color: 'text-gray-900' },
          { label: t('stats.avgValue'), value: `${(stats.avgContractValue / 1e6).toFixed(2)} mil.`, color: 'text-gray-900' },
          { label: t('stats.competitive'), value: `${stats.competitiveRate}%`, color: 'text-violet-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-padded !p-4">
            <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
            <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search & filter bar */}
      <div className="card-padded mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={15} />
            {t('filters.title')}
          </button>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('filters.sector')}</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('filters.allSectors')}</option>
                {PROCUREMENT_SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">{t('filters.status')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-gray-300 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('filters.allStatuses')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="awarded">{t('status.awarded')}</option>
                <option value="cancelled">{t('status.cancelled')}</option>
                <option value="complete">{t('status.complete')}</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setQuery(''); setSector('all'); setStatus('all'); }}
                className="btn-ghost text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X size={14} />
                {t('search.clear')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      <p className="text-sm text-gray-500 mb-3">
        {t('showing')} <span className="font-medium text-gray-900">{results.length}</span>{' '}
        {t('of')} <span className="font-medium text-gray-900">{TENDERS.length}</span>{' '}
        {t('results')}
      </p>

      {/* Table */}
      <div className="card overflow-hidden mb-8">
        {results.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">{t('noResults')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {[
                    t('table.id'),
                    t('table.title'),
                    t('table.authority'),
                    t('table.value'),
                    t('table.method'),
                    t('table.status'),
                    t('table.date'),
                    t('table.bids'),
                    '',
                  ].map((header, i) => (
                    <th
                      key={i}
                      className={`text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 ${
                        i === 3 || i === 7 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((tender) => (
                  <TenderRow key={tender.id} tender={tender} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="card-padded mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('chart.title')}</h2>
        <p className="text-sm text-gray-500 mb-6">Volumul total de achiziții pe sector (milioane MDL), 2024</p>
        <ProcurementBarChart />
      </div>

      {/* Source */}
      <p className="text-xs text-gray-400 text-center">{t('source')}</p>
    </div>
  );
}
