import type { Tender } from './types';

export const MTENDER_BASE = 'https://public.mtender.gov.md';

// Initial cursor for bootstrap window. The MTender /tenders/ endpoint is
// cursor-paginated ascending by date; pass this via ?offset= to start from
// 2022-01-01 and walk forward toward today.
export const MTENDER_BOOTSTRAP_FROM = '2022-01-01T00:00:00.000Z';

type ListPage = {
  data: Array<{ ocid: string; date: string }>;
  offset: string;
};

type OcdsRecord = {
  records?: Array<{
    ocid: string;
    compiledRelease?: {
      ocid: string;
      id?: string;
      date?: string;
      tag?: string[];
      tender?: {
        id?: string;
        title?: string;
        titleRu?: string;
        description?: string;
        status?: string;
        statusDetails?: string;
        value?: { amount?: number; currency?: string };
        procurementMethod?: string;
        procurementMethodDetails?: string;
        mainProcurementCategory?: string;
        classification?: { scheme?: string; id?: string; description?: string };
        tenderPeriod?: { startDate?: string; endDate?: string };
        numberOfTenderers?: number;
        procuringEntity?: { id?: string; name?: string };
      };
      parties?: Array<{ id?: string; name?: string; roles?: string[] }>;
      awards?: Array<{
        id?: string;
        status?: string;
        date?: string;
        value?: { amount?: number; currency?: string };
        suppliers?: Array<{ id?: string; name?: string }>;
      }>;
    };
  }>;
};

export async function listTenders(cursor: string): Promise<ListPage> {
  const url = `${MTENDER_BASE}/tenders/?offset=${encodeURIComponent(cursor)}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`MTender list ${res.status} at ${cursor}`);
  return (await res.json()) as ListPage;
}

export async function fetchRecord(ocid: string): Promise<OcdsRecord | null> {
  const url = `${MTENDER_BASE}/tenders/${encodeURIComponent(ocid)}`;
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`MTender detail ${res.status} for ${ocid}`);
  return (await res.json()) as OcdsRecord;
}

// CPV top-level → our coarse sector bucket. This is approximate: CPV is an
// 8-digit taxonomy; the first 2 digits roughly partition by domain. We map a
// few common branches; everything else falls to "Altele".
const CPV_SECTOR: Array<[RegExp, string]> = [
  [/^30|^32|^48|^72/, 'IT & Digitalizare'],
  [/^33/, 'Sănătate'],
  [/^34/, 'Infrastructură'],
  [/^35/, 'Apărare & Securitate'],
  [/^09|^65|^71/, 'Energie'],
  [/^15|^03|^16/, 'Agricultură'],
  [/^80|^92/, 'Educație'],
  [/^45/, 'Infrastructură'],
  [/^37|^92/, 'Cultură & Sport'],
];

function bucketSector(cpv: string | undefined): string {
  if (!cpv) return 'Altele';
  for (const [re, label] of CPV_SECTOR) if (re.test(cpv)) return label;
  return 'Altele';
}

const METHOD_MAP: Record<string, Tender['method']> = {
  open: 'open',
  selective: 'limited',
  limited: 'limited',
  direct: 'direct',
};

const STATUS_MAP: Record<string, Tender['status']> = {
  planning: 'active',
  planned: 'active',
  active: 'active',
  tendering: 'active',
  cancelled: 'cancelled',
  unsuccessful: 'cancelled',
  complete: 'complete',
  awarded: 'awarded',
  contract: 'awarded',
};

export function normalize(rec: OcdsRecord): Tender | null {
  const cr = rec.records?.[0]?.compiledRelease;
  if (!cr || !cr.tender) return null;
  const t = cr.tender;
  const title = t.title ?? cr.ocid;
  const amount = t.value?.amount ?? 0;
  const currency = t.value?.currency ?? 'MDL';

  const buyer = cr.parties?.find((p) => p.roles?.includes('buyer'));
  const award = cr.awards?.find((a) => a.status === 'active') ?? cr.awards?.[0];
  const winner = award?.suppliers?.[0]?.name;

  const rawStatus = (t.statusDetails ?? t.status ?? 'active').toLowerCase();
  const status: Tender['status'] = STATUS_MAP[rawStatus] ?? 'active';
  const rawMethod = (t.procurementMethod ?? 'open').toLowerCase();
  const method: Tender['method'] = METHOD_MAP[rawMethod] ?? 'open';

  const publishedDate = (cr.date ?? t.tenderPeriod?.startDate ?? '').slice(0, 10);
  const deadlineDate = (t.tenderPeriod?.endDate ?? '').slice(0, 10);
  const sector = bucketSector(t.classification?.id);

  return {
    id: cr.ocid,
    ocid: cr.ocid,
    title,
    titleRu: t.titleRu ?? title,
    authority: buyer?.name ?? t.procuringEntity?.name ?? '—',
    authorityId: buyer?.id ?? t.procuringEntity?.id ?? '',
    sector,
    sectorRo: sector,
    value: amount,
    currency,
    status,
    method,
    publishedDate,
    deadlineDate,
    winner,
    bids: t.numberOfTenderers,
  };
}

// Run up to `concurrency` promises at a time; collects fulfilled values,
// swallows individual failures (logged via onError) so one bad record can't
// poison the whole batch.
export async function mapParallel<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R | null>,
  onError?: (item: T, err: unknown) => void
): Promise<R[]> {
  const out: R[] = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      const item = items[idx]!;
      try {
        const r = await fn(item);
        if (r !== null && r !== undefined) out.push(r);
      } catch (err) {
        onError?.(item, err);
      }
    }
  });
  await Promise.all(workers);
  return out;
}
