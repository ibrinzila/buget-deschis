import { NextResponse } from 'next/server';
import { TENDERS, PROCUREMENT_STATS, searchTenders } from '@/lib/procurement-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? '';
  const sector = searchParams.get('sector') ?? 'all';
  const status = searchParams.get('status') ?? 'all';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100);
  const format = searchParams.get('format') ?? 'json';

  const allResults = searchTenders(query, sector, status);
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
      },
    });
  }

  const response = {
    meta: {
      title: 'Moldova Public Procurement – MTender Data',
      source: 'MTender eProcurement System – Republic of Moldova',
      standard: 'OCDS 1.1 (Open Contracting Data Standard)',
      currency: 'MDL',
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
