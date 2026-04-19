import { NextResponse } from 'next/server';
import { TENDERS as SEED_TENDERS, PROCUREMENT_STATS, searchTenders } from '@/lib/procurement-data';
import type { Tender } from '@/lib/types';

const SNAPSHOT_KEY = 'snapshot:tenders';

// Try Cloudflare KV first; fall back to in-memory seed if the binding is
// missing (local dev) or the snapshot hasn't been populated yet.
async function loadTenders(): Promise<{ tenders: Tender[]; source: 'kv' | 'seed' }> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    const kv = env?.MTENDER_KV;
    if (kv) {
      const raw = await kv.get(SNAPSHOT_KEY, { type: 'json' });
      if (Array.isArray(raw) && raw.length > 0) {
        return { tenders: raw as Tender[], source: 'kv' };
      }
    }
  } catch {
    // No CF context (e.g. `next dev` on plain node) — fall through to seed.
  }
  return { tenders: SEED_TENDERS, source: 'seed' };
}

function filterTenders(
  tenders: Tender[],
  query: string,
  sector: string,
  status: string
): Tender[] {
  const q = query.toLowerCase();
  return tenders.filter((t) => {
    const matchesQuery =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.authority.toLowerCase().includes(q) ||
      t.ocid.toLowerCase().includes(q);
    const matchesSector = !sector || sector === 'all' || t.sector === sector;
    const matchesStatus = !status || status === 'all' || t.status === status;
    return matchesQuery && matchesSector && matchesStatus;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const sector = searchParams.get('sector') ?? 'all';
  const status = searchParams.get('status') ?? 'all';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const format = searchParams.get('format') ?? 'json';

  const { tenders, source } = await loadTenders();
  const allResults =
    source === 'kv'
      ? filterTenders(tenders, query, sector, status)
      : searchTenders(query, sector, status);
  const start = (page - 1) * limit;
  const paginated = allResults.slice(start, start + limit);

  if (format === 'csv') {
    const rows = [
      ['ocid', 'title', 'authority', 'sector', 'value_mdl', 'method', 'status', 'published_date', 'deadline_date', 'bids', 'winner'],
      ...allResults.map((t) => [
        t.ocid,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.authority}"`,
        t.sector,
        t.value,
        t.method,
        t.status,
        t.publishedDate,
        t.deadlineDate,
        t.bids ?? '',
        t.winner ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    return new Response('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="moldova-procurement.csv"',
        'Access-Control-Allow-Origin': '*',
        'X-Data-Source': source,
      },
    });
  }

  // Raw mode: return plain Tender[] (no OCDS wrapping, no pagination). Used by
  // the procurement page for client-side filtering over the full snapshot.
  if (format === 'raw') {
    return NextResponse.json(
      { source, total: allResults.length, tenders: allResults },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=1800',
          'X-Data-Source': source,
        },
      }
    );
  }

  const response = {
    meta: {
      title: 'Moldova Public Procurement – MTender Data',
      source: 'MTender eProcurement System – Republic of Moldova',
      standard: 'OCDS 1.1 (Open Contracting Data Standard)',
      currency: 'MDL',
      dataSource: source,
      snapshotSize: source === 'kv' ? tenders.length : undefined,
      generated: new Date().toISOString(),
    },
    pagination: {
      page,
      limit,
      total: allResults.length,
      totalPages: Math.ceil(allResults.length / limit),
    },
    stats: PROCUREMENT_STATS,
    releases: paginated.map((t) => ({
      ocid: t.ocid,
      title: t.title,
      titleRu: t.titleRu,
      buyerName: t.authority,
      buyerId: t.authorityId,
      sector: t.sector,
      tender: {
        value: { amount: t.value, currency: t.currency },
        procurementMethod: t.method,
        status: t.status,
        datePublished: t.publishedDate,
        tenderPeriod: { endDate: t.deadlineDate },
        numberOfTenderers: t.bids,
      },
      awards: t.winner
        ? [{ suppliers: [{ name: t.winner }], status: 'active' }]
        : [],
    })),
  };

  return NextResponse.json(response, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800',
      'X-Data-Source': source,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
