'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { BUDGET_DATA, BUDGET_TREND, SECTOR_STORY } from '@/lib/budget-data';
import { getBudgetMeta } from '@/lib/budget-meta';
import type { BudgetSector, BudgetTrend } from '@/lib/types';

const meta = getBudgetMeta();
const data = BUDGET_DATA[meta.latestYear]!;
const total = data.totalApproved;

function nf(v: number, locale = 'ro') {
  return new Intl.NumberFormat(locale === 'ro' ? 'ro-MD' : locale === 'ru' ? 'ru-RU' : 'en-US').format(v);
}

function CountUp({ to, duration = 1200, decimals = 0 }: { to: number; duration?: number; decimals?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <span className="tnum">{val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span>;
}

function Eyebrow({ num, children }: { num?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      {num && <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>{num}</span>}
      <div style={{ flex: num ? '0 0 24px' : '0', height: '1px', background: 'var(--ink)', opacity: num ? 0.3 : 0 }} />
      <span className="eyebrow">{children}</span>
    </div>
  );
}

function MiniStat({ label, value, sub, color }: { label: string; value: React.ReactNode; sub: string; color?: string }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div className="serif" style={{ fontSize: '22px', fontWeight: 500, color: color || 'var(--ink)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '2px' }}>{sub}</div>
    </div>
  );
}

function sectorLocalName(s: BudgetSector, locale: string) {
  if (locale === 'ru') return s.nameRu;
  if (locale === 'en') return s.nameEn;
  return s.name;
}

function HomeTreemap({ sorted, onHover, locale }: { sorted: BudgetSector[]; onHover: (s: BudgetSector | null) => void; locale: string }) {
  const col1 = sorted.slice(0, 3);
  const col2 = sorted.slice(3, 7);
  const col3 = sorted.slice(7);
  const Block = ({ s }: { s: BudgetSector }) => {
    const pct = (s.approved / total) * 100;
    return (
      <div
        onMouseEnter={() => onHover(s)}
        onMouseLeave={() => onHover(null)}
        style={{
          background: s.color,
          color: 'var(--paper)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: 'pointer',
          outline: '1px solid var(--ink)',
        }}
      >
        <div>
          <div className="mono" style={{ fontSize: '10px', letterSpacing: '0.1em', opacity: 0.7 }}>{s.code}</div>
          <div className="serif" style={{ fontSize: pct > 15 ? '28px' : pct > 8 ? '20px' : '14px', fontWeight: 500, lineHeight: 1.1, marginTop: '4px', letterSpacing: '-0.01em' }}>
            {sectorLocalName(s, locale)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
          <span className="mono" style={{ fontSize: pct > 15 ? '22px' : pct > 8 ? '16px' : '12px', fontWeight: 600 }}>{pct.toFixed(1)}%</span>
          <span className="mono" style={{ fontSize: '10px', opacity: 0.7 }}>{nf(s.approved, locale)} mil</span>
        </div>
      </div>
    );
  };
  return (
    <div style={{ border: '1px solid var(--ink)', background: 'var(--ink)', display: 'grid', gridTemplateColumns: '2.8fr 1.8fr 1fr', gap: '1px', height: '560px' }}>
      <div style={{ display: 'grid', gridTemplateRows: col1.map((s) => `${s.approved}fr`).join(' '), gap: '1px' }}>{col1.map((s) => <Block key={s.id} s={s} />)}</div>
      <div style={{ display: 'grid', gridTemplateRows: col2.map((s) => `${s.approved}fr`).join(' '), gap: '1px' }}>{col2.map((s) => <Block key={s.id} s={s} />)}</div>
      <div style={{ display: 'grid', gridTemplateRows: col3.map((s) => `${s.approved}fr`).join(' '), gap: '1px' }}>{col3.map((s) => <Block key={s.id} s={s} />)}</div>
    </div>
  );
}

function TrendChart({ data: d, t }: { data: BudgetTrend[]; t: (k: string) => string }) {
  const w = 1200, h = 380;
  const padL = 60, padR = 80, padT = 20, padB = 40;
  const iw = w - padL - padR, ih = h - padT - padB;
  // Scale ceiling: next round-10 above the largest approved value, so the
  // chart breathes even if approved grows past 100 in future fiscal years.
  const peak = Math.max(...d.map((p) => p.approved));
  const max = Math.max(110, Math.ceil(peak / 10) * 10 + 10);
  const xs = d.map((_, i) => padL + (i / (d.length - 1)) * iw);
  const y = (v: number) => padT + ih - (v / max) * ih;
  const apPath = d.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${y(p.approved)}`).join(' ');
  const acPath = d.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${y(p.actual)}`).join(' ');
  const euPath = d.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${y(p.euFunds)}`).join(' ');
  const apArea = apPath + ` L ${xs[xs.length - 1]} ${y(0)} L ${xs[0]} ${y(0)} Z`;
  const last = d[d.length - 1]!;
  const candidacyIdx = Math.max(0, d.findIndex((p) => p.year === 2022));
  const candidacy = d[candidacyIdx]!;
  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <div style={{ position: 'relative', background: 'var(--paper)', border: '1px solid var(--ink)', padding: '24px' }}>
      <div style={{ display: 'flex', gap: '24px', marginBottom: '8px', fontSize: '12px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '16px', height: '3px', background: 'var(--forest)' }} />{t('approved')}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '16px', height: '3px', background: 'var(--ink)', opacity: 0.5 }} />{t('executed')}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><span style={{ display: 'inline-block', width: '16px', height: '3px', background: 'var(--ochre)' }} />{t('euFunds')}</span>
        <span className="mono" style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--ink-3)' }}>mld MDL</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke="var(--ink)" strokeOpacity={v === 0 ? 0.3 : 0.08} />
            <text x={padL - 10} y={y(v) + 4} textAnchor="end" fontFamily="var(--mono)" fontSize="11" fill="var(--ink-3)">{v}</text>
          </g>
        ))}
        <path d={apArea} fill="var(--forest)" fillOpacity="0.08" />
        <path d={apPath} stroke="var(--forest)" strokeWidth="2.5" fill="none" />
        <path d={acPath} stroke="var(--ink)" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.6" />
        <path d={euPath} stroke="var(--ochre)" strokeWidth="2" fill="none" />
        {d.map((p, i) => (
          <g key={p.year}>
            <circle cx={xs[i]} cy={y(p.approved)} r="4" fill="var(--paper)" stroke="var(--forest)" strokeWidth="2" />
            <text x={xs[i]} y={h - padB + 22} textAnchor="middle" fontFamily="var(--mono)" fontSize="11" fill="var(--ink-2)">{p.year}</text>
          </g>
        ))}
        <g>
          <text x={xs[xs.length - 1] + 10} y={y(last.approved) + 4} fontFamily="var(--serif)" fontSize="14" fontWeight="500" fill="var(--forest)">{last.approved.toFixed(1)}</text>
          <text x={xs[xs.length - 1] + 10} y={y(last.actual) + 4} fontFamily="var(--serif)" fontSize="13" fill="var(--ink-3)">{last.actual.toFixed(1)}</text>
          <text x={xs[xs.length - 1] + 10} y={y(last.euFunds) + 4} fontFamily="var(--serif)" fontSize="13" fill="var(--ochre-2)" fontWeight="500">{last.euFunds.toFixed(1)}</text>
        </g>
        <g>
          <line x1={xs[candidacyIdx]} x2={xs[candidacyIdx]} y1={y(candidacy.euFunds) + 4} y2={y(candidacy.euFunds) + 40} stroke="var(--ink-3)" strokeWidth="0.5" />
          <rect x={xs[candidacyIdx] - 70} y={y(candidacy.euFunds) + 40} width="180" height="40" fill="var(--paper-2)" stroke="var(--ink-3)" strokeWidth="0.5" />
          <text x={xs[candidacyIdx] - 62} y={y(candidacy.euFunds) + 56} fontFamily="var(--serif)" fontStyle="italic" fontSize="12" fill="var(--ink)">{t('annotationTitle')}</text>
          <text x={xs[candidacyIdx] - 62} y={y(candidacy.euFunds) + 70} fontFamily="var(--sans)" fontSize="11" fill="var(--ink-3)">{t('annotationSub')}</text>
        </g>
      </svg>
    </div>
  );
}

function CitizenCalc({ locale }: { locale: string }) {
  const t = useTranslations('home.citizen');
  const [income, setIncome] = useState(12000);
  const taxRate = 0.18;
  const vatShare = 0.1;
  const annual = income * 12;
  const taxPaid = annual * taxRate + annual * vatShare;

  const myShare = data.sectors
    .map((s) => ({ ...s, mine: Math.round(taxPaid * (s.approved / total)) }))
    .sort((a, b) => b.mine - a.mine);

  return (
    <div className="bd-calc" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '60px', alignItems: 'start' }}>
      <style>{`@media (max-width: 900px) { .bd-calc { grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
      <div>
        <div className="mono" style={{ fontSize: '11px', letterSpacing: '0.15em', color: 'var(--ochre-3)', marginBottom: '16px' }}>{t('eyebrow')}</div>
        <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', lineHeight: 1.05, fontWeight: 400, margin: '0 0 20px', letterSpacing: '-0.02em' }}>
          {t('titlePre')} <em style={{ color: 'var(--ochre-3)', fontStyle: 'italic' }}>{nf(income, locale)} {t('suffix')}</em> {t('titlePost')}
        </h2>
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--paper-3)', margin: '0 0 28px' }}>
          {t('lead', { amount: nf(Math.round(taxPaid), locale) })}
          <br /><br />
          {t('intro', { year: meta.latestYear })}
        </p>
        <div style={{ marginBottom: '16px' }}>
          <label className="eyebrow" style={{ color: 'var(--ochre-3)' }}>{t('income')}</label>
          <input type="range" min={5000} max={50000} step={1000} value={income} onChange={(e) => setIncome(+e.target.value)} style={{ width: '100%', marginTop: '12px', accentColor: 'var(--ochre)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--paper-3)', marginTop: '4px' }}>
            <span className="mono">5 000</span>
            <span className="mono" style={{ color: 'var(--ochre)' }}>{nf(income, locale)}</span>
            <span className="mono">50 000</span>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--ink-4)', fontStyle: 'italic' }}>{t('disclaimer')}</div>
      </div>

      <div style={{ background: 'var(--paper)', color: 'var(--ink)', padding: '32px', border: '1px solid var(--ochre)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
          <div className="eyebrow">{t('annual')}</div>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--ink-3)' }}>{t('estimated')}</div>
        </div>
        <div className="serif" style={{ fontSize: '52px', lineHeight: 1, fontWeight: 500, color: 'var(--forest)', margin: '4px 0 24px', letterSpacing: '-0.02em' }}>
          {nf(Math.round(taxPaid), locale)} <span className="mono" style={{ fontSize: '16px', color: 'var(--ink-3)', fontWeight: 400 }}>{t('suffix')}</span>
        </div>
        <div style={{ borderTop: '1px solid var(--ink)', paddingTop: '16px' }}>
          {myShare.slice(0, 7).map((s) => (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', gap: '12px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--rule)' }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{sectorLocalName(s, locale)}</div>
              <div style={{ height: '6px', background: 'var(--paper-2)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min((s.approved / total) * 100 * 3, 100)}%`, background: s.color }} />
              </div>
              <div className="mono" style={{ fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>{nf(s.mine, locale)} {t('suffix')}</div>
            </div>
          ))}
        </div>
        <button className="btn" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>{t('download')}</button>
      </div>
    </div>
  );
}

function HighlightBlock({ num, stat, label, body, last }: { num: string; stat: string; label: string; body: string; last?: boolean }) {
  return (
    <div style={{ padding: '32px 24px', borderRight: last ? 'none' : '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
      <div className="mono" style={{ fontSize: '10px', color: 'var(--ink-3)', marginBottom: '24px' }}>— {num}</div>
      <div className="serif" style={{ fontSize: '64px', lineHeight: 0.9, fontWeight: 400, color: 'var(--forest)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>{stat}</div>
      <div className="eyebrow" style={{ marginBottom: '16px' }}>{label}</div>
      <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--ink-2)', margin: 0 }}>{body}</p>
    </div>
  );
}

export default function HomePage() {
  const locale = useLocale();
  const th = useTranslations('home.hero');
  const tt = useTranslations('home.treemap');
  const trnd = useTranslations('home.trend');
  const ttools = useTranslations('home.tools');
  const tc = useTranslations('home.cta');
  const thl = useTranslations('home.highlights');
  const [hoverSector, setHoverSector] = useState<BudgetSector | null>(null);
  const [procCount, setProcCount] = useState<number | null>(null);
  const [procRange, setProcRange] = useState<string | null>(null);
  const sorted = [...data.sectors].sort((a, b) => b.approved - a.approved);
  const trendLatest = BUDGET_TREND[BUDGET_TREND.length - 1]!;

  useEffect(() => {
    let cancelled = false;
    fetch('/api/procurement?format=raw')
      .then((r) => r.json())
      .then((d: { tenders?: Array<{ publishedDate?: string }> }) => {
        if (cancelled) return;
        const arr = Array.isArray(d.tenders) ? d.tenders : [];
        setProcCount(arr.length);
        let min = Infinity;
        let max = -Infinity;
        for (const tx of arr) {
          const y = Number(tx.publishedDate?.slice(0, 4));
          if (!Number.isFinite(y)) continue;
          if (y < min) min = y;
          if (y > max) max = y;
        }
        if (Number.isFinite(min)) {
          setProcRange(min === max ? String(min) : `${min}–${max}`);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const localeTag = locale === 'ro' ? 'ro-RO' : locale === 'ru' ? 'ru-RU' : 'en-US';
  const dateStr = new Date().toLocaleDateString(localeTag, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <style>{`
        @media (max-width: 900px) {
          .bd-hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; align-items: start !important; }
          .bd-hero-aside { border-left: none !important; padding-left: 0 !important; }
          .bd-treemap-grid { grid-template-columns: 1fr !important; }
          .bd-treemap-sticky { position: static !important; }
          .bd-tools-grid { grid-template-columns: 1fr !important; }
          .bd-trend-head { grid-template-columns: 1fr !important; }
          .bd-highlights { grid-template-columns: 1fr !important; }
          .bd-cta { flex-direction: column; align-items: flex-start !important; }
        }
      `}</style>

      <section style={{ position: 'relative', background: 'var(--paper)', overflow: 'hidden' }}>
        <div className="wrap" style={{ padding: '48px 24px 40px' }}>
          <div className="bd-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '60px', alignItems: 'end' }}>
            <div>
              <div className="rise" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
                <span className="mono" style={{ fontSize: '11px', letterSpacing: '0.12em', color: 'var(--ink-3)' }}>{th('eyebrow')} {dateStr}</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--ink)', opacity: 0.3 }} />
                <span className="tag tag-dot tag-live">{th('live')} · {timeStr}</span>
              </div>
              <h1 className="serif rise rise-1" style={{ fontSize: 'var(--fs-d1)', lineHeight: 0.95, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 28px', color: 'var(--ink)' }}>
                {th('titlePre')} <em style={{ color: 'var(--forest)', fontStyle: 'italic' }}>{th('titleEm')}</em> <br />{th('titlePost')}
              </h1>
              <p className="rise rise-2" style={{ fontSize: '19px', lineHeight: 1.5, color: 'var(--ink-2)', maxWidth: '560px', margin: '0 0 36px' }}>
                {th('subtitle')} <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{th('subtitleEm', { year: meta.latestYear })}</strong>
              </p>
              <div className="rise rise-3" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/budget" className="btn btn-forest">{th('ctaBudget')}</Link>
                <Link href="/procurement" className="btn">{th('ctaProcurement')}</Link>
              </div>
            </div>

            <div className="rise rise-3 bd-hero-aside" style={{ borderLeft: '1px solid var(--ink)', paddingLeft: '32px' }}>
              <div className="eyebrow" style={{ marginBottom: '12px' }}>{th('asideEyebrow')}</div>
              <div className="serif" style={{ fontSize: 'var(--fs-d2)', lineHeight: 0.9, fontWeight: 500, margin: '0 0 4px', color: 'var(--forest)' }}>
                <CountUp to={trendLatest.approved} decimals={1} />
                <span className="mono" style={{ fontSize: '18px', color: 'var(--ink-3)', fontWeight: 400, marginLeft: '6px' }}>mld MDL</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '4px 0 24px' }}>{th('asideEuro')}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                <MiniStat
                  label={th('kpiExecuted')}
                  value={<><CountUp to={trendLatest.actual} decimals={1} /> mld</>}
                  sub={th('kpiExecutedSub', { pct: meta.executionRate.toFixed(1) })}
                  color="var(--forest)"
                />
                <MiniStat
                  label={th('kpiProcurement', { year: meta.latestYear })}
                  value={procCount === null ? '…' : nf(procCount, locale)}
                  sub={th('kpiProcurementSub', { range: procRange ?? '—' })}
                  color="var(--ochre)"
                />
                <MiniStat label={th('kpiObi')} value="81/100" sub={th('kpiObiSub')} />
                <MiniStat
                  label={th('kpiEu')}
                  value={`${trendLatest.euFunds.toFixed(1)} mld`}
                  sub={th('kpiEuSub', { pct: (meta.euFundsYoY ?? 0).toFixed(1), prevYear: meta.previousYear })}
                />
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--ink)' }} />
      </section>

      <section style={{ background: 'var(--paper)', padding: '72px 0 40px' }}>
        <div className="wrap">
          <div className="bd-treemap-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '48px', alignItems: 'start' }}>
            <div className="bd-treemap-sticky" style={{ position: 'sticky', top: '88px' }}>
              <Eyebrow num="§01">{tt('eyebrow')}</Eyebrow>
              <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 20px' }}>
                {tt('titlePre')} <em style={{ color: 'var(--forest)' }}>{tt('titleEm')}</em>{tt('titlePost')}
              </h2>
              <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 0 20px' }}>{tt('lead')}</p>
              {hoverSector && (
                <div className="bd-card bd-card-pad" style={{ background: 'var(--paper-2)' }}>
                  <div className="eyebrow">COFOG {hoverSector.code}</div>
                  <h3 className="serif" style={{ fontSize: '22px', margin: '4px 0 6px', fontWeight: 500 }}>{sectorLocalName(hoverSector, locale)}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--ink-3)', margin: '0 0 14px' }}>{SECTOR_STORY[hoverSector.id]}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div><div className="mono" style={{ fontSize: '10px', color: 'var(--ink-3)' }}>{tt('approved')}</div><div className="mono" style={{ fontSize: '18px' }}>{nf(hoverSector.approved, locale)} <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>mil</span></div></div>
                    <div><div className="mono" style={{ fontSize: '10px', color: 'var(--ink-3)' }}>{tt('executed')}</div><div className="mono" style={{ fontSize: '18px' }}>{nf(hoverSector.actual, locale)} <span style={{ fontSize: '11px', color: 'var(--ink-3)' }}>mil</span></div></div>
                  </div>
                  <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--rule)', fontSize: '13px', color: 'var(--ink-2)' }}>
                    <strong>{((hoverSector.approved / total) * 100).toFixed(1)}%</strong> {tt('ofBudget')} · <strong>{nf(Math.round(hoverSector.approved / 2.5), locale)} lei</strong> {tt('perCapita')}
                  </div>
                </div>
              )}
              {!hoverSector && <p style={{ fontSize: '13px', color: 'var(--ink-4)', fontStyle: 'italic', marginTop: '16px' }}>{tt('hint')}</p>}
            </div>
            <HomeTreemap sorted={sorted} onHover={setHoverSector} locale={locale} />
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--paper-2)', padding: '72px 0', borderTop: '1px solid var(--ink)', borderBottom: '1px solid var(--ink)' }}>
        <div className="wrap">
          <Eyebrow num="§02">{trnd('eyebrow', { range: meta.rangeLabel })}</Eyebrow>
          <div className="bd-trend-head" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px', alignItems: 'end', marginBottom: '32px' }}>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>
              {trnd('titlePre')} <em style={{ color: 'var(--forest)' }}>{trnd('titleEm', { pct: Math.round(meta.approvedRangeGrowthPct) })}</em> {trnd('titlePost', { years: meta.yearsCovered })}
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>
              {trnd('lead', {
                from: BUDGET_TREND[0]!.approved.toFixed(1),
                to: trendLatest.approved.toFixed(1),
                multiple: meta.euFundsRangeMultiple.toFixed(1),
              })}
            </p>
          </div>
          <TrendChart data={BUDGET_TREND} t={trnd} />
        </div>
      </section>

      <section style={{ background: 'var(--paper)', padding: '72px 0' }}>
        <div className="wrap">
          <Eyebrow num="§03">{ttools('eyebrow')}</Eyebrow>
          <div className="bd-trend-head" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
            <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{ttools('title')}</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--ink-2)', margin: 0, alignSelf: 'end' }}>{ttools('subtitle')}</p>
          </div>
          <div className="bd-tools-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: '1px solid var(--ink)' }}>
            {[
              { n: '01', href: '/budget' as const, t: ttools('budget.title'), d: ttools('budget.desc') },
              { n: '02', href: '/procurement' as const, t: ttools('procurement.title'), d: ttools('procurement.desc') },
              { n: '03', href: '/about' as const, t: ttools('methodology.title'), d: ttools('methodology.desc') },
              { n: '04', href: '/about' as const, t: ttools('data.title'), d: ttools('data.desc') },
            ].map((f, i) => (
              <Link
                key={f.n}
                href={f.href}
                style={{
                  padding: '32px 24px',
                  borderRight: i < 3 ? '1px solid var(--ink)' : 'none',
                  background: 'var(--paper)',
                  textDecoration: 'none',
                  color: 'var(--ink)',
                  minHeight: '280px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className="mono" style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'var(--ink-3)', marginBottom: '24px' }}>— {f.n}</div>
                <h3 className="serif" style={{ fontSize: '22px', fontWeight: 500, letterSpacing: '-0.01em', margin: '0 0 12px' }}>{f.t}</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--ink-2)', margin: '0 0 auto' }}>{f.d}</p>
                <div style={{ marginTop: '24px', fontSize: '12px', fontWeight: 600, color: 'var(--forest)' }}>{ttools('open')}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '80px 0', overflow: 'hidden' }}>
        <div className="wrap">
          <CitizenCalc locale={locale} />
        </div>
      </section>

      <section style={{ background: 'var(--paper)', padding: '72px 0', borderTop: '1px solid var(--ink)' }}>
        <div className="wrap">
          <Eyebrow num="§04">{thl('eyebrow')}</Eyebrow>
          <h2 className="serif" style={{ fontSize: 'var(--fs-h1)', lineHeight: 1.05, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 40px', maxWidth: '700px' }}>
            {thl('title', { year: meta.latestYear })}
          </h2>
          <div className="bd-highlights" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: '1px solid var(--ink)' }}>
            <HighlightBlock
              num="01"
              stat={`+${Math.round(meta.approvedRangeGrowthPct)}%`}
              label={thl('one.label', { range: meta.rangeLabel })}
              body={thl('one.body', {
                from: BUDGET_TREND[0]!.approved.toFixed(1),
                to: trendLatest.approved.toFixed(1),
              })}
            />
            <HighlightBlock num="02" stat={thl('two.stat')} label={thl('two.label')} body={thl('two.body')} />
            <HighlightBlock
              num="03"
              stat={procCount === null ? '…' : nf(procCount, locale)}
              label={thl('three.label', { range: procRange ?? '—' })}
              body={thl('three.body', { range: procRange ?? '—' })}
              last
            />
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--forest)', color: 'var(--paper)', padding: '56px 0' }}>
        <div className="wrap bd-cta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '40px' }}>
          <div>
            <div className="mono" style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ochre-3)', marginBottom: '12px' }}>{tc('eyebrow')}</div>
            <h3 className="serif" style={{ fontSize: '36px', fontWeight: 400, fontStyle: 'italic', margin: 0, lineHeight: 1.1, maxWidth: '700px' }}>{tc('title')}</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
            <a className="btn" style={{ background: 'var(--paper)', color: 'var(--ink)', borderColor: 'var(--paper)' }} href="https://github.com/ibrinzila/buget-deschis" target="_blank" rel="noopener noreferrer">{tc('github')}</a>
            <Link className="btn" style={{ background: 'transparent', borderColor: 'var(--paper-3)', color: 'var(--paper)' }} href="/about">{tc('methodology')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
