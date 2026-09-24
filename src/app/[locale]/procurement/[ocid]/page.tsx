'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import type { Tender } from '@/lib/types';

// ---- OCDS 1.1 shapes we care about ---------------------------------------
// Everything is optional because MTender only fills a subset per record. We
// pass unknowns through to the raw-JSON section so nothing is hidden.
type Value = { amount?: number; currency?: string };
type Period = { startDate?: string; endDate?: string; durationInDays?: number };
type Classification = { scheme?: string; id?: string; description?: string };
type Address = {
  streetAddress?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  countryName?: string;
};
type ContactPoint = { name?: string; email?: string; telephone?: string; url?: string };
type Party = {
  id?: string;
  name?: string;
  identifier?: { scheme?: string; id?: string; legalName?: string };
  address?: Address;
  contactPoint?: ContactPoint;
  roles?: string[];
};
type Document = {
  id?: string;
  documentType?: string;
  title?: string;
  description?: string;
  url?: string;
  datePublished?: string;
  dateModified?: string;
  format?: string;
  language?: string;
};
type Item = {
  id?: string;
  description?: string;
  classification?: Classification;
  additionalClassifications?: Classification[];
  quantity?: number;
  unit?: { name?: string; value?: Value };
  deliveryAddress?: Address;
  deliveryDate?: Period;
};
type Milestone = {
  id?: string;
  title?: string;
  description?: string;
  type?: string;
  code?: string;
  status?: string;
  dueDate?: string;
  dateMet?: string;
  dateModified?: string;
};
type Amendment = {
  id?: string;
  date?: string;
  rationale?: string;
  description?: string;
  amendsReleaseID?: string;
};
type Award = {
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  date?: string;
  value?: Value;
  suppliers?: Array<{ id?: string; name?: string }>;
  items?: Item[];
  contractPeriod?: Period;
  documents?: Document[];
  amendments?: Amendment[];
};
type Contract = {
  id?: string;
  awardID?: string;
  title?: string;
  description?: string;
  status?: string;
  period?: Period;
  value?: Value;
  items?: Item[];
  dateSigned?: string;
  documents?: Document[];
  amendments?: Amendment[];
};
type BidDetail = {
  id?: string;
  status?: string;
  date?: string;
  value?: Value;
  tenderers?: Array<{ id?: string; name?: string }>;
  documents?: Document[];
};
type CompiledRelease = {
  ocid?: string;
  id?: string;
  date?: string;
  language?: string;
  tag?: string[];
  planning?: { budget?: { amount?: Value }; rationale?: string; documents?: Document[] };
  tender?: {
    id?: string;
    title?: string;
    titleRu?: string;
    description?: string;
    descriptionRu?: string;
    status?: string;
    statusDetails?: string;
    items?: Item[];
    value?: Value;
    minValue?: Value;
    procurementMethod?: string;
    procurementMethodDetails?: string;
    procurementMethodRationale?: string;
    mainProcurementCategory?: string;
    additionalProcurementCategories?: string[];
    awardCriteria?: string;
    submissionMethod?: string[];
    submissionMethodDetails?: string;
    tenderPeriod?: Period;
    enquiryPeriod?: Period;
    hasEnquiries?: boolean;
    numberOfTenderers?: number;
    procuringEntity?: { id?: string; name?: string };
    documents?: Document[];
    milestones?: Milestone[];
    amendments?: Amendment[];
    classification?: Classification;
  };
  parties?: Party[];
  awards?: Award[];
  contracts?: Contract[];
  bids?: { details?: BidDetail[] };
};

type DetailPayload = {
  source: 'kv' | 'live';
  ocid: string;
  tender: Tender | null;
  ocds: CompiledRelease | null;
};

// ---- Formatters ----------------------------------------------------------
function fmtNum(n: number): string {
  return new Intl.NumberFormat('ro-MD', { maximumFractionDigits: 0 }).format(n);
}
function fmtMoney(n: number | undefined | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} mld`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} mil`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} k`;
  return fmtNum(n);
}
function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}
function fmtDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  return iso.slice(0, 16).replace('T', ' ');
}
function daysBetween(a: string | undefined, b: string | undefined): number | null {
  if (!a || !b) return null;
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (!Number.isFinite(da) || !Number.isFinite(db)) return null;
  return Math.max(0, Math.round((db - da) / 86400000));
}
function pickTitle(cr: CompiledRelease | null, tender: Tender | null, locale: string): string {
  if (locale === 'ru') return cr?.tender?.titleRu ?? tender?.titleRu ?? cr?.tender?.title ?? tender?.title ?? cr?.ocid ?? '—';
  return cr?.tender?.title ?? tender?.title ?? cr?.tender?.titleRu ?? tender?.titleRu ?? cr?.ocid ?? '—';
}
function pickDescription(cr: CompiledRelease | null, locale: string): string | null {
  if (locale === 'ru' && cr?.tender?.descriptionRu) return cr.tender.descriptionRu;
  return cr?.tender?.description ?? cr?.tender?.descriptionRu ?? null;
}

// ---- Style helpers -------------------------------------------------------
const styles = {
  section: { padding: '48px 0', borderBottom: '1px solid var(--ink)' } as const,
  sectionTitle: {
    fontSize: 'var(--fs-h2)',
    fontWeight: 500,
    margin: '0 0 24px',
    letterSpacing: '-0.02em',
  } as const,
  kv: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr',
    gap: '10px 20px',
    fontSize: '14px',
    lineHeight: 1.45,
  } as const,
  kvLabel: {
    fontFamily: 'var(--mono)',
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--ink-3)',
    paddingTop: '2px',
  },
  card: {
    border: '1px solid var(--ink)',
    background: 'var(--paper)',
    padding: '20px',
  } as const,
};

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

// ---- Risk flag reuse (kept in sync with list page) ----------------------
type FlagReason = 'directHighValue' | 'singleBidder' | 'lowCompetition';
function flagReasons(t: Tender | null): FlagReason[] {
  if (!t) return [];
  const reasons: FlagReason[] = [];
  if (t.method === 'direct' && t.value > 20_000_000) reasons.push('directHighValue');
  if ((t.bids ?? 0) === 1 && t.status === 'awarded') reasons.push('singleBidder');
  if (t.value > 20_000_000 && (t.bids ?? 0) <= 2) reasons.push('lowCompetition');
  return reasons;
}

const KNOWN_ROLES = new Set([
  'buyer',
  'procuringEntity',
  'payer',
  'supplier',
  'tenderer',
  'funder',
  'enquirer',
  'payee',
  'reviewBody',
  'interestedParty',
]);

function statusBadgeColor(status: string | undefined): string {
  switch (status) {
    case 'planning':
      return 'var(--ink-3)';
    case 'active':
    case 'tendering':
      return 'var(--forest)';
    case 'cancelled':
    case 'unsuccessful':
      return 'var(--bad)';
    case 'complete':
    case 'awarded':
    case 'contract':
      return 'var(--ink)';
    default:
      return 'var(--ink-3)';
  }
}

// ---- Timeline component --------------------------------------------------
function Timeline({
  events,
}: {
  events: Array<{ label: string; date: string | undefined; tone?: 'forest' | 'ochre' | 'ink' }>;
}) {
  const rendered = events.filter((e) => e.date);
  if (rendered.length === 0) return null;
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {rendered.map((e, i) => {
        const color = e.tone === 'ochre' ? 'var(--ochre)' : e.tone === 'ink' ? 'var(--ink)' : 'var(--forest)';
        return (
          <li
            key={`${e.label}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr auto',
              gap: '16px',
              padding: '14px 0',
              borderBottom: i === rendered.length - 1 ? 'none' : '1px solid var(--rule)',
              alignItems: 'baseline',
            }}
          >
            <span
              aria-hidden
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '999px',
                background: color,
                border: '1px solid var(--ink)',
                display: 'inline-block',
                marginTop: '4px',
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{e.label}</span>
            <span className="mono" style={{ fontSize: '12px', color: 'var(--ink-3)' }}>
              {fmtDate(e.date)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function ProcurementDetailPage({
  params,
}: {
  params: { locale: string; ocid: string };
}) {
  const t = useTranslations('procurement');
  const locale = useLocale();
  const ocid = decodeURIComponent(params.ocid);

  const [data, setData] = useState<DetailPayload | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    fetch(`/api/procurement/${encodeURIComponent(ocid)}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) setStatus('notfound');
          return;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = (await r.json()) as DetailPayload;
        if (cancelled) return;
        setData(j);
        setStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [ocid]);

  const cr = data?.ocds ?? null;
  const tender = data?.tender ?? null;

  const title = useMemo(() => pickTitle(cr, tender, locale), [cr, tender, locale]);
  const description = useMemo(() => pickDescription(cr, locale), [cr, locale]);

  useEffect(() => {
    if (status === 'ok' && title) {
      document.title = `${title} · ${ocid}`;
    }
  }, [status, title, ocid]);

  const parties = cr?.parties ?? [];
  const awards = cr?.awards ?? [];
  const contracts = cr?.contracts ?? [];
  const items = cr?.tender?.items ?? [];
  const bids = cr?.bids?.details ?? [];
  const milestones = cr?.tender?.milestones ?? [];
  const amendments: Array<Amendment & { source: string }> = [
    ...(cr?.tender?.amendments ?? []).map((a) => ({ ...a, source: 'tender' })),
    ...awards.flatMap((a) => (a.amendments ?? []).map((am) => ({ ...am, source: `award ${a.id ?? '—'}` }))),
    ...contracts.flatMap((c) => (c.amendments ?? []).map((am) => ({ ...am, source: `contract ${c.id ?? '—'}` }))),
  ];

  const allDocs: Array<Document & { section: string }> = [
    ...(cr?.tender?.documents ?? []).map((d) => ({ ...d, section: 'tender' })),
    ...(cr?.planning?.documents ?? []).map((d) => ({ ...d, section: 'planning' })),
    ...awards.flatMap((a) => (a.documents ?? []).map((d) => ({ ...d, section: `award ${a.id ?? '—'}` }))),
    ...contracts.flatMap((c) => (c.documents ?? []).map((d) => ({ ...d, section: `contract ${c.id ?? '—'}` }))),
    ...bids.flatMap((b) => (b.documents ?? []).map((d) => ({ ...d, section: `bid ${b.id ?? '—'}` }))),
  ];

  const tenderPeriodDays = daysBetween(cr?.tender?.tenderPeriod?.startDate, cr?.tender?.tenderPeriod?.endDate);

  const flags = flagReasons(tender);
  const currency = cr?.tender?.value?.currency ?? tender?.currency ?? 'MDL';
  const value = cr?.tender?.value?.amount ?? tender?.value ?? null;

  function copyShareLink() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => setCopied(false)
    );
  }

  function downloadJson() {
    if (!cr) return;
    const blob = new Blob([JSON.stringify(cr, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ocid}.ocds.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Loading / not-found states ---------------------------------------
  if (status === 'loading') {
    return (
      <div style={{ background: 'var(--paper)', minHeight: '60vh' }}>
        <div className="wrap" style={{ padding: '80px 0' }}>
          <Link
            href={`/${locale}/procurement`}
            className="mono"
            style={{
              fontSize: '11px',
              textDecoration: 'none',
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {t('detail.backToList')}
          </Link>
          <p style={{ marginTop: '48px', color: 'var(--ink-3)', fontStyle: 'italic' }}>
            {t('detail.loading')}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'notfound' || status === 'error' || !data) {
    return (
      <div style={{ background: 'var(--paper)', minHeight: '60vh' }}>
        <div className="wrap" style={{ padding: '80px 0' }}>
          <Link
            href={`/${locale}/procurement`}
            className="mono"
            style={{
              fontSize: '11px',
              textDecoration: 'none',
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {t('detail.backToList')}
          </Link>
          <h1 className="serif" style={{ fontSize: 'var(--fs-h1)', margin: '32px 0 12px', fontWeight: 500 }}>
            {t('detail.notFound')}
          </h1>
          <p style={{ color: 'var(--ink-3)' }}>{t('detail.notFoundHint')}</p>
          <p className="mono" style={{ marginTop: '16px', fontSize: '12px', color: 'var(--ink-3)' }}>
            {t('detail.ocid')}: {ocid}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--paper)' }}>
      {/* ---- Hero ------------------------------------------------------- */}
      <section style={{ borderBottom: '1px solid var(--ink)', padding: '32px 0 40px' }}>
        <div className="wrap">
          <Link
            href={`/${locale}/procurement`}
            className="mono"
            style={{
              fontSize: '11px',
              textDecoration: 'none',
              color: 'var(--ink-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '20px',
            }}
          >
            {t('detail.backToList')}
          </Link>

          <div
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--ink-3)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span>
              {t('detail.ocid')} · <span style={{ color: 'var(--forest)' }}>{ocid}</span>
            </span>
            {data.source === 'live' && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  border: '1px solid var(--ochre)',
                  color: 'var(--ochre-2)',
                }}
              >
                LIVE MTENDER
              </span>
            )}
          </div>

          <h1
            className="serif"
            style={{
              fontSize: 'var(--fs-d2)',
              lineHeight: 1.02,
              fontWeight: 400,
              letterSpacing: '-0.03em',
              margin: '0 0 16px',
              maxWidth: '1100px',
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.55,
                color: 'var(--ink-2)',
                margin: '0 0 24px',
                maxWidth: '820px',
              }}
            >
              {description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
            {tender?.status && (
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  border: `1px solid ${statusBadgeColor(tender.status)}`,
                  color: statusBadgeColor(tender.status),
                }}
              >
                {t(`status.${tender.status === 'complete' ? 'awarded' : tender.status}`)}
              </span>
            )}
            {tender?.method && (
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  border: '1px solid var(--ink)',
                  background:
                    tender.method === 'open'
                      ? 'var(--paper)'
                      : tender.method === 'direct'
                      ? 'var(--bad)'
                      : 'var(--warn)',
                  color: tender.method === 'open' ? 'var(--ink)' : 'var(--paper)',
                }}
              >
                {t(`method.${tender.method}`)}
              </span>
            )}
            {cr?.tender?.mainProcurementCategory && (
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  border: '1px solid var(--rule)',
                  color: 'var(--ink-2)',
                }}
              >
                {cr.tender.mainProcurementCategory}
              </span>
            )}
            {tender?.sector && (
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  border: '1px solid var(--rule)',
                  color: 'var(--ink-2)',
                }}
              >
                {tender.sector}
              </span>
            )}
            {flags.map((f) => (
              <span
                key={f}
                className="mono"
                style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  border: '1px solid var(--ochre)',
                  color: 'var(--ochre-2)',
                }}
              >
                ⚐ {t(`flag.reason.${f}`)}
              </span>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              marginTop: '20px',
            }}
          >
            <a
              className="btn"
              href={`https://public.mtender.gov.md/tenders/${encodeURIComponent(ocid)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {t('detail.openOnMtender')}
            </a>
            <button className="btn" onClick={downloadJson} disabled={!cr}>
              {t('detail.downloadJson')}
            </button>
            <button className="btn btn-ghost" onClick={copyShareLink}>
              {copied ? t('detail.shareCopied') : t('detail.shareLink')}
            </button>
          </div>
        </div>
      </section>

      {/* ---- Summary KPIs --------------------------------------------- */}
      <section style={{ borderBottom: '1px solid var(--ink)', background: 'var(--paper-2)' }}>
        <div
          className="wrap bd-stats-row"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}
        >
          {[
            {
              l: t('detail.summary.value'),
              v: fmtMoney(value),
              sub: currency,
              tone: 'ink' as const,
            },
            {
              l: t('detail.summary.bidders'),
              v: tender?.bids != null ? String(tender.bids) : cr?.tender?.numberOfTenderers != null ? String(cr.tender.numberOfTenderers) : '—',
              sub: bids.length > 0 ? `${bids.length} detailed` : '—',
              tone: 'forest' as const,
            },
            {
              l: t('detail.summary.awards'),
              v: String(awards.length),
              sub: awards.filter((a) => a.status === 'active').length > 0 ? 'active' : '—',
              tone: 'forest' as const,
            },
            {
              l: t('detail.summary.contracts'),
              v: String(contracts.length),
              sub: contracts.filter((c) => c.dateSigned).length > 0 ? 'signed' : '—',
              tone: 'ink' as const,
            },
            {
              l: t('detail.summary.items'),
              v: String(items.length),
              sub: '—',
              tone: 'ink' as const,
            },
            {
              l: t('detail.summary.duration'),
              v: tenderPeriodDays != null ? String(tenderPeriodDays) : '—',
              sub: tenderPeriodDays != null ? t('detail.summary.days') : '—',
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
                      : s.tone === 'ochre'
                      ? 'var(--ochre)'
                      : 'var(--ink)',
                  letterSpacing: '-0.02em',
                }}
              >
                {s.v}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '6px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Timeline --------------------------------------------------- */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="A">{t('detail.section.timeline')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.timeline')}
          </h2>
          <div style={styles.card}>
            <Timeline
              events={[
                { label: t('detail.timeline.published'), date: cr?.date ?? tender?.publishedDate, tone: 'ink' },
                { label: t('detail.timeline.tenderStart'), date: cr?.tender?.tenderPeriod?.startDate, tone: 'forest' },
                { label: t('detail.timeline.tenderEnd'), date: cr?.tender?.tenderPeriod?.endDate ?? tender?.deadlineDate, tone: 'forest' },
                { label: t('detail.timeline.awardDate'), date: awards[0]?.date, tone: 'ochre' },
                { label: t('detail.timeline.contractSigned'), date: contracts[0]?.dateSigned, tone: 'ochre' },
                { label: t('detail.timeline.contractEnd'), date: contracts[0]?.period?.endDate, tone: 'ink' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ---- Items ------------------------------------------------------ */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="B">{t('detail.section.items')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.items')}
          </h2>
          {items.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: '13px' }}>
              {t('detail.items.empty')}
            </p>
          ) : (
            <div style={{ border: '1px solid var(--ink)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
                <thead>
                  <tr style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--ink)' }}>
                    {[
                      '#',
                      t('detail.items.description'),
                      t('detail.items.classification'),
                      t('detail.items.quantity'),
                      t('detail.items.unit'),
                      t('detail.items.deliveryAddress'),
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
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
                  {items.map((it, i) => (
                    <tr key={it.id ?? i} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--ink-3)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px', maxWidth: '360px' }}>
                        {it.description ?? '—'}
                      </td>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--forest)' }}>
                        {it.classification?.id ?? '—'}
                        {it.classification?.description && (
                          <div style={{ color: 'var(--ink-3)', marginTop: '2px' }}>
                            {it.classification.description}
                          </div>
                        )}
                      </td>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '12px', textAlign: 'right' }}>
                        {it.quantity != null ? fmtNum(it.quantity) : '—'}
                      </td>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--ink-3)' }}>
                        {it.unit?.name ?? '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--ink-2)' }}>
                        {it.deliveryAddress
                          ? [
                              it.deliveryAddress.streetAddress,
                              it.deliveryAddress.locality,
                              it.deliveryAddress.region,
                              it.deliveryAddress.countryName,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ---- Parties ---------------------------------------------------- */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="C">{t('detail.section.parties')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.parties')}
          </h2>
          {parties.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: '13px' }}>
              {t('detail.parties.empty')}
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {parties.map((p, i) => (
                <div key={p.id ?? i} style={styles.card}>
                  <div
                    className="mono"
                    style={{
                      fontSize: '10px',
                      color: 'var(--ink-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginBottom: '8px',
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {(p.roles ?? []).map((r) => (
                      <span
                        key={r}
                        style={{
                          padding: '1px 6px',
                          border: '1px solid var(--rule)',
                          color: 'var(--forest)',
                        }}
                      >
                        {KNOWN_ROLES.has(r) ? t(`detail.parties.roles.${r}` as never) : r}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: 1.3, marginBottom: '10px' }}>
                    {p.name ?? '—'}
                  </div>
                  <div style={styles.kv}>
                    {p.identifier?.id && (
                      <>
                        <span style={styles.kvLabel}>{t('detail.parties.identifier')}</span>
                        <span className="mono" style={{ fontSize: '12px' }}>
                          {p.identifier.id}
                        </span>
                      </>
                    )}
                    {p.address && (
                      <>
                        <span style={styles.kvLabel}>{t('detail.parties.address')}</span>
                        <span style={{ fontSize: '12px', color: 'var(--ink-2)' }}>
                          {[p.address.streetAddress, p.address.locality, p.address.region, p.address.countryName]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </span>
                      </>
                    )}
                    {p.contactPoint && (
                      <>
                        <span style={styles.kvLabel}>{t('detail.parties.contact')}</span>
                        <span style={{ fontSize: '12px', color: 'var(--ink-2)' }}>
                          {p.contactPoint.name && <div>{p.contactPoint.name}</div>}
                          {p.contactPoint.email && (
                            <div>
                              <a
                                href={`mailto:${p.contactPoint.email}`}
                                style={{ color: 'var(--forest)', textDecoration: 'underline' }}
                              >
                                {p.contactPoint.email}
                              </a>
                            </div>
                          )}
                          {p.contactPoint.telephone && <div className="mono">{p.contactPoint.telephone}</div>}
                          {p.contactPoint.url && (
                            <div>
                              <a
                                href={p.contactPoint.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                style={{ color: 'var(--forest)', textDecoration: 'underline' }}
                              >
                                {p.contactPoint.url}
                              </a>
                            </div>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Bids ------------------------------------------------------ */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="D">{t('detail.section.bids')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.bids')}
          </h2>
          {bids.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: '13px' }}>
              {t('detail.bids.empty')}
            </p>
          ) : (
            <div style={{ border: '1px solid var(--ink)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead>
                  <tr style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--ink)' }}>
                    {[t('detail.bids.bidId'), t('detail.bids.tenderer'), t('detail.bids.amount'), t('detail.bids.status')].map(
                      (h, i) => (
                        <th
                          key={i}
                          style={{
                            textAlign: i === 2 ? 'right' : 'left',
                            padding: '10px 14px',
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
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b, i) => (
                    <tr key={b.id ?? i} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--forest)' }}>
                        {b.id ?? '—'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '13px' }}>
                        {(b.tenderers ?? []).map((tt) => tt.name).filter(Boolean).join(', ') || '—'}
                      </td>
                      <td
                        className="mono"
                        style={{ padding: '12px 14px', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}
                      >
                        {fmtMoney(b.value?.amount)}{' '}
                        <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>{b.value?.currency ?? ''}</span>
                      </td>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '11px', color: statusBadgeColor(b.status) }}>
                        {b.status ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ---- Awards ---------------------------------------------------- */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="E">{t('detail.section.awards')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.awards')}
          </h2>
          {awards.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: '13px' }}>
              {t('detail.awards.empty')}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {awards.map((a, i) => (
                <div key={a.id ?? i} style={styles.card}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '16px',
                      alignItems: 'baseline',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div
                        className="mono"
                        style={{ fontSize: '10px', color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                      >
                        {t('detail.awards.awardId')} · {a.id ?? '—'}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                        {a.title ?? '—'}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: '11px', color: statusBadgeColor(a.status) }}>
                      {a.status ?? '—'}
                    </div>
                  </div>
                  <div style={styles.kv}>
                    <span style={styles.kvLabel}>{t('detail.awards.awardDate')}</span>
                    <span className="mono" style={{ fontSize: '12px' }}>
                      {fmtDate(a.date)}
                    </span>
                    <span style={styles.kvLabel}>{t('detail.awards.supplier')}</span>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>
                      {(a.suppliers ?? []).map((s) => s.name).filter(Boolean).join(', ') || '—'}
                    </span>
                    <span style={styles.kvLabel}>{t('detail.awards.amount')}</span>
                    <span className="mono" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {fmtMoney(a.value?.amount)}{' '}
                      <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>{a.value?.currency ?? currency}</span>
                    </span>
                    {a.description && (
                      <>
                        <span style={styles.kvLabel}>desc</span>
                        <span style={{ fontSize: '13px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                          {a.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Contracts ------------------------------------------------- */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="F">{t('detail.section.contracts')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.contracts')}
          </h2>
          {contracts.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: '13px' }}>
              {t('detail.contracts.empty')}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {contracts.map((c, i) => (
                <div key={c.id ?? i} style={styles.card}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '16px',
                      alignItems: 'baseline',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div
                        className="mono"
                        style={{ fontSize: '10px', color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                      >
                        {t('detail.contracts.contractId')} · {c.id ?? '—'}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                        {c.title ?? '—'}
                      </div>
                    </div>
                    <div className="mono" style={{ fontSize: '11px', color: statusBadgeColor(c.status) }}>
                      {c.status ?? '—'}
                    </div>
                  </div>
                  <div style={styles.kv}>
                    <span style={styles.kvLabel}>{t('detail.contracts.signed')}</span>
                    <span className="mono" style={{ fontSize: '12px' }}>
                      {fmtDate(c.dateSigned)}
                    </span>
                    <span style={styles.kvLabel}>{t('detail.contracts.period')}</span>
                    <span className="mono" style={{ fontSize: '12px' }}>
                      {fmtDate(c.period?.startDate)} → {fmtDate(c.period?.endDate)}
                    </span>
                    <span style={styles.kvLabel}>{t('detail.contracts.amount')}</span>
                    <span className="mono" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {fmtMoney(c.value?.amount)}{' '}
                      <span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>{c.value?.currency ?? currency}</span>
                    </span>
                    {c.description && (
                      <>
                        <span style={styles.kvLabel}>desc</span>
                        <span style={{ fontSize: '13px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                          {c.description}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Documents ------------------------------------------------- */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="G">{t('detail.section.documents')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.documents')}
          </h2>
          {allDocs.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: '13px' }}>
              {t('detail.documents.empty')}
            </p>
          ) : (
            <div style={{ border: '1px solid var(--ink)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                <thead>
                  <tr style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--ink)' }}>
                    {[t('detail.documents.title'), t('detail.documents.type'), t('detail.documents.date'), ''].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
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
                  {allDocs.map((d, i) => (
                    <tr key={(d.id ?? '') + i} style={{ borderBottom: '1px solid var(--rule)' }}>
                      <td style={{ padding: '12px 14px', fontSize: '13px', maxWidth: '360px' }}>
                        {d.title ?? d.id ?? '—'}
                        {d.description && (
                          <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '2px' }}>
                            {d.description}
                          </div>
                        )}
                        <div className="mono" style={{ fontSize: '10px', color: 'var(--ink-3)', marginTop: '4px' }}>
                          §{d.section}
                        </div>
                      </td>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--ink-2)' }}>
                        {d.documentType ?? '—'}
                      </td>
                      <td className="mono" style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--ink-3)' }}>
                        {fmtDate(d.datePublished ?? d.dateModified)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mono"
                            style={{
                              fontSize: '11px',
                              padding: '4px 10px',
                              border: '1px solid var(--ink)',
                              textDecoration: 'none',
                              color: 'var(--ink)',
                              background: 'var(--paper)',
                            }}
                          >
                            {t('detail.documents.open')}
                          </a>
                        ) : (
                          <span className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ---- Milestones & amendments ---------------------------------- */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="H">{t('detail.section.milestones')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.milestones')}
          </h2>
          {milestones.length === 0 && amendments.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: 'var(--ink-3)', fontSize: '13px' }}>
              {t('detail.milestones.empty')}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {milestones.map((m, i) => (
                <div
                  key={m.id ?? `m-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 120px',
                    gap: '16px',
                    padding: '12px 16px',
                    border: '1px solid var(--rule)',
                    background: 'var(--paper)',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: '10px',
                      color: 'var(--forest)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {t('detail.milestones.milestone')}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{m.title ?? m.code ?? '—'}</div>
                    {m.description && (
                      <div style={{ fontSize: '12px', color: 'var(--ink-3)', marginTop: '2px' }}>{m.description}</div>
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)', textAlign: 'right' }}>
                    {fmtDate(m.dueDate ?? m.dateMet)}
                    <div style={{ color: statusBadgeColor(m.status) }}>{m.status ?? ''}</div>
                  </div>
                </div>
              ))}
              {amendments.map((a, i) => (
                <div
                  key={a.id ?? `a-${i}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 120px',
                    gap: '16px',
                    padding: '12px 16px',
                    border: '1px solid var(--ochre)',
                    background: 'var(--paper)',
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      fontSize: '10px',
                      color: 'var(--ochre-2)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {t('detail.milestones.amendment')}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>
                      {a.description ?? a.rationale ?? '—'}
                    </div>
                    {a.rationale && a.description && a.rationale !== a.description && (
                      <div style={{ fontSize: '12px', color: 'var(--ink-3)', marginTop: '4px' }}>
                        <span style={{ fontStyle: 'italic' }}>{t('detail.milestones.rationale')}: </span>
                        {a.rationale}
                      </div>
                    )}
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--ink-3)', marginTop: '4px' }}>
                      §{a.source}
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: '11px', color: 'var(--ink-3)', textAlign: 'right' }}>
                    {fmtDate(a.date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Risk flags ------------------------------------------------ */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="I">{t('detail.section.flags')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.flags')}
          </h2>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--ink-3)',
              fontStyle: 'italic',
              maxWidth: '720px',
              marginBottom: '20px',
            }}
          >
            {t('detail.flags.whatThis')}
          </p>
          {flags.length === 0 ? (
            <div
              style={{
                border: '1px solid var(--forest)',
                background: 'var(--paper)',
                padding: '16px 20px',
                fontSize: '13px',
                color: 'var(--forest)',
                fontWeight: 500,
              }}
            >
              ✓ {t('detail.flags.none')}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {flags.map((f) => (
                <div
                  key={f}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '16px',
                    padding: '16px 20px',
                    border: '1px solid var(--ochre)',
                    borderLeft: '4px solid var(--ochre)',
                    background: 'var(--paper)',
                    alignItems: 'start',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      background: 'var(--ochre)',
                      color: 'var(--ink)',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '16px',
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontWeight: 700,
                    }}
                  >
                    !
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                      {t(`detail.flags.${f}`)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                      {t(`detail.flags.${f}Desc`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---- Raw OCDS -------------------------------------------------- */}
      <section style={styles.section}>
        <div className="wrap">
          <Eyebrow num="J">{t('detail.section.raw')}</Eyebrow>
          <h2 className="serif" style={styles.sectionTitle}>
            {t('detail.section.raw')}
          </h2>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--ink-3)',
              fontStyle: 'italic',
              maxWidth: '720px',
              marginBottom: '16px',
            }}
          >
            {t('detail.raw.note')}
          </p>
          <button className="btn" onClick={() => setShowRaw((v) => !v)}>
            {showRaw ? t('detail.raw.hide') : t('detail.raw.show')}
          </button>
          {showRaw && cr && (
            <pre
              className="mono"
              style={{
                marginTop: '20px',
                padding: '20px',
                background: 'var(--paper-2)',
                border: '1px solid var(--ink)',
                fontSize: '11px',
                lineHeight: 1.55,
                overflowX: 'auto',
                maxHeight: '600px',
              }}
            >
              {JSON.stringify(cr, null, 2)}
            </pre>
          )}
          <p style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '24px', fontStyle: 'italic' }}>
            {t('source')} · {t('detail.ocid')}: {ocid} · {fmtDateTime(cr?.date)}
          </p>
        </div>
      </section>
    </div>
  );
}
