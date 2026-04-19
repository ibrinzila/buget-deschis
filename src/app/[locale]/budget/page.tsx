'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { BUDGET_DATA, BUDGET_TREND, AVAILABLE_YEARS, SECTOR_STORY, computeSectorPct } from '@/lib/budget-data';
import { getBudgetMeta } from '@/lib/budget-meta';
import type { BudgetSector, BudgetYearData, Locale } from '@/lib/types';

const meta = getBudgetMeta();

type ViewKey = 'approved' | 'revised' | 'actual';

function sectorLocalName(s: BudgetSector, locale: string) {
  if (locale === 'ru') return s.nameRu;
  if (locale === 'en') return s.nameEn;
  return s.name;
}

function fmt(n: number) {
  return new Intl.NumberFormat('ro-MD', { maximumFractionDigits: 0 }).format(n);
}

function Eyebrow({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
      <span
        className="mono"
        style={{
          fontSize: '11px',
          background: 'var(--ink)',
          color: 'var(--paper)',
          padding: '2px 8px',
          letterSpacing: '0.1em',
        }}
      >
        {num}
      </span>
      <span style={{ flex: 1, height: '1px', background: 'var(--rule)' }} />
      <span
        className="mono"
        style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}
      >
        {children}
      </span>
    </div>
  );
}

export default function BudgetPage() {
  const t = useTranslations('budget');
  const locale = useLocale() as Locale;

  const [year, setYear] = useState<number>(meta.latestYear);
  const [view, setView] = useState<ViewKey>('approved');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rawData = BUDGET_DATA[year] ?? BUDGET_DATA[meta.latestYear]!;
  const data: BudgetYearData = useMemo(() => computeSectorPct(rawData), [rawData]);
  const total = data.totalApproved;

  const sorted = useMemo(
    () => [...data.sectors].sort((a, b) => b[view] - a[view]),
    [data.sectors, view]
  );

  const selected = selectedId ? sorted.find((s) => s.id === selectedId) ?? sorted[0] : sorted[0];
  const topSector = sorted[0]!;

  const prev = year > 2019 ? BUDGET_DATA[year - 1] : null;
  const pctChange = prev ? ((data.totalApproved - prev.totalApproved) / prev.totalApproved) * 100 : 0;

  function downloadCSV() {
    const rows = [
      ['COFOG', 'Sector', 'Aprobat', 'Revizuit', 'Executat', 'Execuție %', 'Pondere %'],
      ...sorted.map((s) => [
        s.code,
        sectorLocalName(s, locale),
        s.approved.toString(),
        s.revised.toString(),
        s.actual.toString(),
        ((s.actual / s.approved) * 100).toFixed(1),
        (s.pct ?? 0).toFixed(1),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buget-moldova-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buget-moldova-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ background: 'var(--paper)', minHeight: '80vh' }}>
      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--ink)', padding: '40px 0 32px' }}>
        <div className="wrap">
          <div
            className="mono"
            style={{ fontSize: '11px', color: 'var(--ink-3)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.14em' }}
          >
            {t('kicker')}
          </div>
          <div className="bd-split-end" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '48px', alignItems: 'end' }}>
            <div>
              <h1
                className="serif"
                style={{ fontSize: 'var(--fs-d2)', lineHeight: 0.95, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 16px' }}
              >
                {t('titlePre')} <em style={{ color: 'var(--forest)' }}>{t('titleEm')}</em> {t('titlePost')}
              </h1>
              <p style={{ fontSize: '17px', lineHeight: 1.55, color: 'var(--ink-2)', margin: 0, maxWidth: '560px' }}>
                {t('subtitle')}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '8px' }}>
                  {t('fiscalYear')}
                </div>
                <div style={{ display: 'flex', border: '1px solid var(--ink)' }}>
                  {AVAILABLE_YEARS.map((y, i) => (
                    <button
                      key={y}
                      onClick={() => {
                        setYear(y);
                        setSelectedId(null);
                      }}
                      style={{
                        flex: 1,
                        border: 'none',
                        padding: '10px',
                        background: year === y ? 'var(--ink)' : 'var(--paper)',
                        color: year === y ? 'var(--paper)' : 'var(--ink)',
                        fontFamily: 'var(--mono)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        borderRight: i < AVAILABLE_YEARS.length - 1 ? '1px solid var(--ink)' : 'none',
                      }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: '8px' }}>
                  {t('viewType.label')}
                </div>
                <div style={{ display: 'flex', border: '1px solid var(--ink)' }}>
                  {(['approved', 'revised', 'actual'] as const).map((k, i) => (
                    <button
                      key={k}
                      onClick={() => setView(k)}
                      style={{
                        flex: 1,
                        border: 'none',
                        padding: '10px',
                        background: view === k ? 'var(--forest)' : 'var(--paper)',
                        color: view === k ? 'var(--paper)' : 'var(--ink)',
                        fontFamily: 'var(--sans)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        borderRight: i < 2 ? '1px solid var(--ink)' : 'none',
                      }}
                    >
                      {t(`viewType.${k}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary row */}
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--paper-2)' }}>
        <div
          className="wrap bd-summary-5"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}
        >
          {[
            {
              l: t('summary.total'),
              v: (data.totalApproved / 1000).toFixed(1),
              u: t('summary.unit'),
              sub: prev ? `${pctChange >= 0 ? '↑' : '↓'} ${Math.abs(pctChange).toFixed(1)}% vs ${year - 1}` : '—',
              tone: 'forest' as const,
            },
            {
              l: t('summary.executed'),
              v: (data.totalActual / 1000).toFixed(1),
              u: t('summary.unit'),
              sub: `${data.executionRate.toFixed(1)}% ${t('summary.executedSub')}`,
              tone: 'forest' as const,
            },
            {
              l: t('summary.topSector'),
              v: sectorLocalName(topSector, locale),
              u: null,
              sub: `${(topSector.pct ?? 0).toFixed(1)}% ${t('summary.topSectorSub')}`,
              tone: 'ink' as const,
            },
            (() => {
              const euNow = BUDGET_TREND.find((b) => b.year === year)?.euFunds ?? 0;
              const euPrev = BUDGET_TREND.find((b) => b.year === year - 1)?.euFunds ?? 0;
              const euYoY = euPrev ? ((euNow - euPrev) / euPrev) * 100 : null;
              return {
                l: t('summary.euFunds'),
                v: (euNow / 1000).toFixed(1),
                u: t('summary.unit'),
                sub:
                  euYoY === null
                    ? '—'
                    : `${euYoY >= 0 ? '↑' : '↓'} ${Math.abs(euYoY).toFixed(1)}% vs ${year - 1}`,
                tone: 'ochre' as const,
              };
            })(),
            {
              l: t('summary.perCapita'),
              v: `~${fmt(Math.round((data.totalApproved * 1_000_000) / 2_600_000 / 1000) * 1000)}`,
              u: 'lei/an',
              sub: t('summary.perCapitaSub'),
              tone: 'ink' as const,
            },
          ].map((s, i) => (
            <div key={i} style={{ padding: '28px 24px', borderRight: i < 4 ? '1px solid var(--ink)' : 'none' }}>
              <div className="eyebrow" style={{ marginBottom: '10px' }}>
                {s.l}
              </div>
              <div
                className="serif"
                style={{
                  fontSize: '32px',
                  lineHeight: 1,
                  fontWeight: 500,
                  color:
                    s.tone === 'forest'
                      ? 'var(--forest)'
                      : s.tone === 'ochre'
                      ? 'var(--ochre)'
                      : 'var(--ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.v}
                {s.u && (
                  <span
                    className="mono"
                    style={{ fontSize: '12px', color: 'var(--ink-3)', fontWeight: 400, marginLeft: '6px' }}
                  >
                    {s.u}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '6px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Treemap + detail */}
      <section style={{ padding: '56px 0', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap">
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}
          >
            <div>
              <Eyebrow num="A">{t('composition.eyebrow')}</Eyebrow>
              <h2
                className="serif"
                style={{ fontSize: 'var(--fs-h1)', fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}
              >
                {t('composition.title')} · {year}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={downloadCSV}
                className="btn btn-ghost"
                style={{ border: '1px solid var(--ink)' }}
              >
                {t('actions.csv')}
              </button>
              <button
                onClick={downloadJSON}
                className="btn btn-ghost"
                style={{ border: '1px solid var(--ink)' }}
              >
                {t('actions.json')}
              </button>
            </div>
          </div>

          <div className="bd-treemap-grid" style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '24px' }}>
            <BudgetTreemap
              sorted={sorted}
              total={total}
              view={view}
              locale={locale}
              onSelect={(id) => setSelectedId(id)}
              selectedId={selected?.id ?? null}
            />
            {selected && <SectorDetail sector={selected} total={total} year={year} locale={locale} t={t} />}
          </div>
        </div>
      </section>

      {/* Data table */}
      <section style={{ padding: '56px 0', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap">
          <Eyebrow num="B">{t('table.eyebrow')}</Eyebrow>
          <h2
            className="serif"
            style={{ fontSize: 'var(--fs-h1)', fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 24px' }}
          >
            {t('table.title')}
          </h2>
          <div style={{ border: '1px solid var(--ink)', background: 'var(--paper)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ink)', background: 'var(--paper-2)' }}>
                  {[t('table.cofog'), t('table.sector'), t('table.approved'), t('table.executed'), t('table.execution'), t('table.share'), ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: i >= 2 && i <= 5 ? 'right' : 'left',
                        padding: '12px 16px',
                        fontFamily: 'var(--mono)',
                        fontSize: '10px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--ink-3)',
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const exec = (s.actual / s.approved) * 100;
                  const execColor =
                    exec >= 90 ? 'var(--good)' : exec >= 75 ? 'var(--warn)' : 'var(--bad)';
                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: '1px solid var(--rule)', cursor: 'pointer' }}
                      onClick={() => setSelectedId(s.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td
                        style={{
                          padding: '14px 16px',
                          fontFamily: 'var(--mono)',
                          fontSize: '12px',
                          color: 'var(--ink-3)',
                        }}
                      >
                        {s.code}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              width: '10px',
                              height: '10px',
                              background: s.color,
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: '14px', fontWeight: 500 }}>
                            {sectorLocalName(s, locale)}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontFamily: 'var(--mono)',
                          fontSize: '13px',
                        }}
                      >
                        {fmt(s.approved)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontFamily: 'var(--mono)',
                          fontSize: '13px',
                        }}
                      >
                        {fmt(s.actual)}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '60px',
                              height: '4px',
                              background: 'var(--paper-2)',
                              border: '1px solid var(--rule)',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(exec, 100)}%`,
                                background: execColor,
                              }}
                            />
                          </div>
                          <span
                            className="mono"
                            style={{ fontSize: '12px', fontWeight: 600, color: execColor }}
                          >
                            {exec.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontFamily: 'var(--mono)',
                          fontSize: '13px',
                          color: 'var(--ink-3)',
                        }}
                      >
                        {(s.pct ?? 0).toFixed(1)}%
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--ink-3)' }}>→</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'var(--ink)', color: 'var(--paper)' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '11px' }}>Σ</td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{t('table.total')}</td>
                  <td
                    style={{
                      padding: '14px 16px',
                      textAlign: 'right',
                      fontFamily: 'var(--mono)',
                      fontWeight: 600,
                    }}
                  >
                    {fmt(data.totalApproved)}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      textAlign: 'right',
                      fontFamily: 'var(--mono)',
                      fontWeight: 600,
                    }}
                  >
                    {fmt(data.totalActual)}
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      textAlign: 'right',
                      fontFamily: 'var(--mono)',
                      fontWeight: 600,
                      color: 'var(--ochre-3)',
                    }}
                  >
                    {data.executionRate.toFixed(1)}%
                  </td>
                  <td
                    style={{
                      padding: '14px 16px',
                      textAlign: 'right',
                      fontFamily: 'var(--mono)',
                      fontWeight: 600,
                    }}
                  >
                    100%
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '16px', fontStyle: 'italic' }}>
            {t('source')}
          </p>
        </div>
      </section>

    </div>
  );
}

function BudgetTreemap({
  sorted,
  total,
  view,
  locale,
  onSelect,
  selectedId,
}: {
  sorted: BudgetSector[];
  total: number;
  view: ViewKey;
  locale: string;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const col1 = sorted.slice(0, 3);
  const col2 = sorted.slice(3, 7);
  const col3 = sorted.slice(7);

  const Block = ({ s }: { s: BudgetSector }) => {
    const pct = (s[view] / (view === 'approved' ? total : total)) * 100;
    const isSel = selectedId === s.id;
    return (
      <button
        onClick={() => onSelect(s.id)}
        style={{
          background: s.color,
          color: 'var(--paper)',
          border: 'none',
          textAlign: 'left',
          padding: pct > 15 ? '18px' : '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: isSel ? '3px solid var(--ochre)' : '1px solid var(--ink)',
          outlineOffset: isSel ? '-3px' : '-1px',
          transition: 'filter 0.15s',
          fontFamily: 'var(--sans)',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
      >
        <div>
          <div className="mono" style={{ fontSize: '10px', opacity: 0.7 }}>
            COFOG · {s.code}
          </div>
          <div
            className="serif"
            style={{
              fontSize: pct > 15 ? '26px' : pct > 8 ? '18px' : '14px',
              fontWeight: 500,
              lineHeight: 1.1,
              marginTop: '4px',
              letterSpacing: '-0.01em',
            }}
          >
            {sectorLocalName(s, locale)}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: '12px',
          }}
        >
          <span
            className="mono"
            style={{ fontSize: pct > 15 ? '24px' : pct > 8 ? '18px' : '13px', fontWeight: 700 }}
          >
            {pct.toFixed(1)}%
          </span>
          <span className="mono" style={{ fontSize: '10px', opacity: 0.8 }}>
            {fmt(s[view])} mil
          </span>
        </div>
      </button>
    );
  };

  return (
    <div
      style={{
        background: 'var(--ink)',
        display: 'grid',
        gridTemplateColumns: '2.8fr 1.6fr 1fr',
        gap: '1px',
        height: '560px',
        border: '1px solid var(--ink)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateRows: col1.map((s) => `${s[view]}fr`).join(' '),
          gap: '1px',
        }}
      >
        {col1.map((s) => (
          <Block key={s.id} s={s} />
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: col2.map((s) => `${s[view]}fr`).join(' '),
          gap: '1px',
        }}
      >
        {col2.map((s) => (
          <Block key={s.id} s={s} />
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateRows: col3.map((s) => `${s[view]}fr`).join(' '),
          gap: '1px',
        }}
      >
        {col3.map((s) => (
          <Block key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}

function SectorDetail({
  sector,
  total,
  year,
  locale,
  t,
}: {
  sector: BudgetSector;
  total: number;
  year: number;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const exec = (sector.actual / sector.approved) * 100;
  const execColor = exec >= 90 ? 'var(--good)' : exec >= 75 ? 'var(--warn)' : 'var(--bad)';
  const share = (sector.approved / total) * 100;
  const story = SECTOR_STORY[sector.id] ?? '';

  const trend = AVAILABLE_YEARS.slice()
    .reverse()
    .map((y) => BUDGET_DATA[y]?.sectors.find((x) => x.id === sector.id)?.approved ?? 0);
  const trendMax = Math.max(...trend, 1);
  const trendPts = trend.map((v, i) => ({
    x: (i / (trend.length - 1)) * 200,
    y: 50 - (v / trendMax) * 40,
  }));

  return (
    <div
      style={{
        border: '1px solid var(--ink)',
        padding: '24px',
        background: 'var(--paper)',
        position: 'sticky',
        top: '88px',
        height: '560px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="mono" style={{ fontSize: '10px', color: 'var(--ink-3)', letterSpacing: '0.12em' }}>
        COFOG {sector.code} · {year}
      </div>
      <h3
        className="serif"
        style={{
          fontSize: '28px',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          margin: '6px 0 6px',
          lineHeight: 1.05,
        }}
      >
        {sectorLocalName(sector, locale)}
      </h3>
      {story && (
        <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 20px', fontStyle: 'italic' }}>
          {story}
        </p>
      )}

      <div style={{ background: 'var(--paper-2)', padding: '16px', marginBottom: '16px' }}>
        <div className="eyebrow" style={{ marginBottom: '6px' }}>
          {t('detail.allocated')} · {share.toFixed(1)}% {t('detail.ofBudget')}
        </div>
        <div
          className="serif"
          style={{
            fontSize: '36px',
            fontWeight: 500,
            color: sector.color,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {fmt(sector.approved)}{' '}
          <span className="mono" style={{ fontSize: '12px', color: 'var(--ink-3)', fontWeight: 400 }}>
            {t('detail.unit')}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ border: '1px solid var(--rule)', padding: '12px' }}>
          <div className="eyebrow">{t('detail.executed')}</div>
          <div
            className="mono"
            style={{ fontSize: '18px', fontWeight: 600, color: 'var(--forest)', marginTop: '4px' }}
          >
            {fmt(sector.actual)}
          </div>
        </div>
        <div style={{ border: '1px solid var(--rule)', padding: '12px' }}>
          <div className="eyebrow">{t('detail.executionRate')}</div>
          <div
            className="mono"
            style={{ fontSize: '18px', fontWeight: 600, color: execColor, marginTop: '4px' }}
          >
            {exec.toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div className="eyebrow" style={{ marginBottom: '8px' }}>
          {t('detail.trend', { range: meta.rangeLabel })}
        </div>
        <svg viewBox="0 0 200 50" style={{ width: '100%', height: '50px' }}>
          {trendPts.map((p, i) => {
            if (i === 0) return null;
            const prev = trendPts[i - 1]!;
            return (
              <line
                key={i}
                x1={prev.x}
                y1={prev.y}
                x2={p.x}
                y2={p.y}
                stroke={sector.color}
                strokeWidth="2"
              />
            );
          })}
          {trendPts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="2.5"
              fill="var(--paper)"
              stroke={sector.color}
              strokeWidth="1.5"
            />
          ))}
        </svg>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          className="btn"
          style={{ fontSize: '12px', padding: '10px', justifyContent: 'center' }}
        >
          {t('detail.subCategories')}
        </button>
        <button
          className="btn btn-ghost"
          style={{ fontSize: '11px', justifyContent: 'center' }}
        >
          {t('detail.downloadCsv')}
        </button>
      </div>
    </div>
  );
}
