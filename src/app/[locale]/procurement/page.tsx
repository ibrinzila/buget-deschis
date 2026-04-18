'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { TENDERS, PROCUREMENT_STATS, PROCUREMENT_SECTORS, searchTenders } from '@/lib/procurement-data';
import type { Tender } from '@/lib/types';

function fmtNum(n: number) {
  return new Intl.NumberFormat('ro-MD', { maximumFractionDigits: 0 }).format(n);
}

function tenderTitle(t: Tender, locale: string) {
  if (locale === 'ru' && t.titleRu) return t.titleRu;
  return t.title;
}

function isFlagged(t: Tender): boolean {
  if (t.method === 'direct' && t.value > 20_000_000) return true;
  if ((t.bids ?? 0) === 1 && t.status === 'awarded') return true;
  if (t.value > 20_000_000 && (t.bids ?? 0) <= 2) return true;
  return false;
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

export default function ProcurementPage() {
  const t = useTranslations('procurement');
  const locale = useLocale();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'awarded' | 'cancelled'>('all');
  const [sector, setSector] = useState<string>('all');
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const stats = PROCUREMENT_STATS;

  const baseResults = useMemo(() => searchTenders(q, sector, status), [q, sector, status]);
  const results = useMemo(
    () => (onlyFlagged ? baseResults.filter(isFlagged) : baseResults),
    [baseResults, onlyFlagged]
  );

  const flaggedCount = useMemo(() => baseResults.filter(isFlagged).length, [baseResults]);

  const totalResultsVolume = useMemo(
    () => results.reduce((a, x) => a + x.value, 0),
    [results]
  );

  const sectorVolumes = useMemo(() => {
    const map = new Map<string, { volume: number; count: number }>();
    for (const tx of TENDERS) {
      const prev = map.get(tx.sector) ?? { volume: 0, count: 0 };
      map.set(tx.sector, { volume: prev.volume + tx.value, count: prev.count + 1 });
    }
    return Array.from(map.entries())
      .map(([s, v]) => ({ sector: s, ...v }))
      .sort((a, b) => b.volume - a.volume);
  }, []);
  const maxVol = Math.max(...sectorVolumes.map((s) => s.volume), 1);
  const totalVolumeAll = sectorVolumes.reduce((a, x) => a + x.volume, 0);

  function resetFilters() {
    setQ('');
    setStatus('all');
    setSector('all');
    setOnlyFlagged(false);
  }

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* Hero */}
      <section style={{ borderBottom: '1px solid var(--ink)', padding: '40px 0 32px' }}>
        <div className="wrap">
          <div
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--ink-3)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            {t('kicker')}
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 'var(--fs-d2)',
              lineHeight: 0.95,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              margin: '0 0 16px',
            }}
          >
            {t('titlePre')} <em style={{ color: 'var(--forest)' }}>{t('titleEm')}</em> {t('titlePost')}
          </h1>
          <p style={{ fontSize: '17px', lineHeight: 1.55, color: 'var(--ink-2)', margin: 0, maxWidth: '680px' }}>
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--paper-2)' }}>
        <div
          className="wrap bd-stats-row"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}
        >
          {[
            {
              l: t('stats.procedures'),
              v: fmtNum(stats.totalProcedures),
              sub: t('stats.proceduresSub'),
              tone: 'ink' as const,
            },
            {
              l: t('stats.active'),
              v: fmtNum(stats.activeTenders),
              sub: t('stats.activeSub'),
              tone: 'forest' as const,
            },
            {
              l: t('stats.awarded'),
              v: fmtNum(stats.awardedContracts),
              sub: t('stats.awardedSub'),
              tone: 'forest' as const,
            },
            {
              l: t('stats.cancelled'),
              v: fmtNum(stats.cancelledTenders),
              sub: t('stats.cancelledSub'),
              tone: 'bad' as const,
            },
            {
              l: t('stats.volume'),
              v: `${(stats.totalVolumeMDL / 1e9).toFixed(1)} mld`,
              sub: t('stats.volumeSub'),
              tone: 'ink' as const,
            },
            {
              l: t('stats.competitive'),
              v: `${stats.competitiveRate.toFixed(0)}%`,
              sub: t('stats.competitiveSub'),
              tone: 'ochre' as const,
            },
          ].map((s, i) => (
            <div key={i} style={{ padding: '24px 20px', borderRight: i < 5 ? '1px solid var(--ink)' : 'none' }}>
              <div className="eyebrow" style={{ marginBottom: '8px' }}>
                {s.l}
              </div>
              <div
                className="serif"
                style={{
                  fontSize: '26px',
                  lineHeight: 1,
                  fontWeight: 500,
                  color:
                    s.tone === 'forest'
                      ? 'var(--forest)'
                      : s.tone === 'bad'
                      ? 'var(--bad)'
                      : s.tone === 'ochre'
                      ? 'var(--ochre)'
                      : 'var(--ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.v}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '4px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Flag callout */}
      {flaggedCount > 0 && (
        <section style={{ padding: '40px 0', borderBottom: '1px solid var(--ink)' }}>
          <div className="wrap">
            <div
              className="bd-flag"
              style={{
                border: '1px solid var(--ochre)',
                padding: '24px',
                background: 'var(--paper)',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: '24px',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'var(--ochre)',
                  color: 'var(--ink)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '24px',
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 600,
                }}
              >
                !
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: '4px', color: 'var(--ochre-2)' }}>
                  {t('flag.eyebrow')}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>
                  {t('flag.title', { count: flaggedCount })}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--ink-3)', marginTop: '4px' }}>
                  {t('flag.desc')}
                </div>
              </div>
              <button
                className="btn btn-ochre"
                onClick={() => setOnlyFlagged((v) => !v)}
              >
                {onlyFlagged ? t('search.reset') : t('flag.cta')}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Search + table */}
      <section style={{ padding: '40px 0', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap">
          <div
            className="bd-filters"
            style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', marginBottom: '24px' }}
          >
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-3)',
                }}
              >
                ⌕
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('search.placeholder')}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 40px',
                  border: '1px solid var(--ink)',
                  background: 'var(--paper)',
                  fontFamily: 'var(--sans)',
                  fontSize: '14px',
                }}
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              style={{
                padding: '12px 14px',
                border: '1px solid var(--ink)',
                background: 'var(--paper)',
                fontFamily: 'var(--sans)',
                fontSize: '13px',
              }}
            >
              <option value="all">{t('search.allStatuses')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="awarded">{t('status.awarded')}</option>
              <option value="cancelled">{t('status.cancelled')}</option>
            </select>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{
                padding: '12px 14px',
                border: '1px solid var(--ink)',
                background: 'var(--paper)',
                fontFamily: 'var(--sans)',
                fontSize: '13px',
              }}
            >
              <option value="all">{t('search.allSectors')}</option>
              {PROCUREMENT_SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button className="btn" onClick={resetFilters}>
              {t('search.reset')}
            </button>
          </div>

          <div
            className="mono"
            style={{ fontSize: '11px', color: 'var(--ink-3)', marginBottom: '12px' }}
          >
            {results.length} {t('search.results')} {TENDERS.length} · {t('search.totalVolume')}{' '}
            {fmtNum(Math.round(totalResultsVolume / 1e6))} {t('search.million')}
          </div>

          <div style={{ border: '1px solid var(--ink)', background: 'var(--paper)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
              <thead>
                <tr style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--ink)' }}>
                  {[
                    t('table.id'),
                    t('table.object'),
                    t('table.authority'),
                    t('table.value'),
                    t('table.method'),
                    t('table.status'),
                    t('table.date'),
                    t('table.bids'),
                  ].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: i === 3 ? 'right' : 'left',
                        padding: '12px 14px',
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
                {results.map((x) => {
                  const flagged = isFlagged(x);
                  return (
                    <tr
                      key={x.id}
                      style={{ borderBottom: '1px solid var(--rule)', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td
                        style={{
                          padding: '14px',
                          fontFamily: 'var(--mono)',
                          fontSize: '11px',
                          color: 'var(--forest)',
                        }}
                      >
                        {x.id.split('-').slice(-1)[0]}
                      </td>
                      <td style={{ padding: '14px', maxWidth: '340px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
                          {tenderTitle(x, locale)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '2px' }}>
                          {x.sector}
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontSize: '12px', color: 'var(--ink-2)' }}>
                        {x.authority}
                      </td>
                      <td
                        style={{
                          padding: '14px',
                          textAlign: 'right',
                          fontFamily: 'var(--mono)',
                          fontSize: '13px',
                          fontWeight: 600,
                        }}
                      >
                        {(x.value / 1e6).toFixed(2)}{' '}
                        <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>mil</span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '10px',
                            padding: '3px 8px',
                            border: '1px solid var(--ink)',
                            background:
                              x.method === 'open'
                                ? 'var(--paper)'
                                : x.method === 'direct'
                                ? 'var(--bad)'
                                : 'var(--warn)',
                            color: x.method === 'open' ? 'var(--ink)' : 'var(--paper)',
                          }}
                        >
                          {t(`method.${x.method}`)}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: '10px',
                            padding: '3px 8px',
                            border: '1px solid',
                            borderColor:
                              x.status === 'active'
                                ? 'var(--forest)'
                                : x.status === 'cancelled'
                                ? 'var(--bad)'
                                : 'var(--ink)',
                            color:
                              x.status === 'active'
                                ? 'var(--forest)'
                                : x.status === 'cancelled'
                                ? 'var(--bad)'
                                : 'var(--ink)',
                          }}
                        >
                          {x.status === 'complete'
                            ? t('status.awarded')
                            : t(`status.${x.status}`)}
                        </span>
                        {flagged && (
                          <span
                            title="Risc"
                            style={{
                              marginLeft: '6px',
                              fontSize: '10px',
                              color: 'var(--ochre-2)',
                            }}
                          >
                            ⚐
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '14px',
                          fontFamily: 'var(--mono)',
                          fontSize: '11px',
                          color: 'var(--ink-3)',
                        }}
                      >
                        {x.publishedDate}
                      </td>
                      <td
                        style={{
                          padding: '14px',
                          fontFamily: 'var(--mono)',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        {x.bids ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sector bar chart */}
      <section style={{ padding: '56px 0', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap">
          <Eyebrow num="A">{t('chart.eyebrow')}</Eyebrow>
          <h2
            className="serif"
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 500,
              margin: '0 0 32px',
              letterSpacing: '-0.02em',
            }}
          >
            {t('chart.title')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sectorVolumes.map((s) => (
              <div
                key={s.sector}
                className="bd-bar-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr 120px 60px',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{s.sector}</div>
                <div style={{ height: '28px', background: 'var(--paper-2)', position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${(s.volume / maxVol) * 100}%`,
                      background: 'var(--forest)',
                    }}
                  />
                  <div
                    className="mono"
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--paper)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textShadow: '0 0 2px var(--forest)',
                    }}
                  >
                    {(s.volume / 1e6).toFixed(1)} mil MDL
                  </div>
                </div>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>
                  {s.count} {t('chart.procedures')}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: '11px', color: 'var(--ink-3)', textAlign: 'right' }}
                >
                  {((s.volume / totalVolumeAll) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '24px', fontStyle: 'italic' }}>
            {t('source')}
          </p>
        </div>
      </section>

    </div>
  );
}
