import { NextResponse } from 'next/server';
import { BUDGET_DATA, AVAILABLE_YEARS, computeSectorPct } from '@/lib/budget-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') ?? '2024', 10);
  const format = searchParams.get('format') ?? 'json';

  if (!AVAILABLE_YEARS.includes(year)) {
    return NextResponse.json(
      { error: `Year ${year} not available. Valid years: ${AVAILABLE_YEARS.join(', ')}` },
      { status: 400 }
    );
  }

  const rawData = BUDGET_DATA[year];
  const data = computeSectorPct(rawData);

  if (format === 'csv') {
    const rows = [
      ['year', 'sector_id', 'sector_name', 'sector_code', 'approved_mdl', 'revised_mdl', 'actual_mdl', 'execution_rate', 'share_pct'],
      ...data.sectors.map((s) => [
        year,
        s.id,
        s.name,
        s.code,
        s.approved,
        s.revised,
        s.actual,
        ((s.actual / s.approved) * 100).toFixed(2),
        (s.pct ?? 0).toFixed(4),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    return new Response('\uFEFF' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="moldova-budget-${year}.csv"`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  const response = {
    meta: {
      title: `Moldova State Budget ${year}`,
      source: 'Ministry of Finance of the Republic of Moldova, World Bank BOOST',
      standard: 'Fiscal Data Package 1.0',
      currency: 'MDL',
      unit: 'millions MDL',
      year,
      generated: new Date().toISOString(),
    },
    summary: {
      totalApproved: data.totalApproved,
      totalRevised: data.totalRevised,
      totalActual: data.totalActual,
      executionRate: data.executionRate,
    },
    sectors: data.sectors.map((s) => ({
      id: s.id,
      name: s.name,
      nameRu: s.nameRu,
      nameEn: s.nameEn,
      cofogCode: s.code,
      approved: s.approved,
      revised: s.revised,
      actual: s.actual,
      executionRate: parseFloat(((s.actual / s.approved) * 100).toFixed(2)),
      shareOfTotal: parseFloat((s.pct ?? 0).toFixed(4)),
    })),
    availableYears: AVAILABLE_YEARS,
  };

  return NextResponse.json(response, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
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
