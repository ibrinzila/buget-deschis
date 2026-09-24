import { NextResponse } from 'next/server';
import { fetchRecord, normalize } from '@/lib/mtender';
import type { Tender } from '@/lib/types';

export const dynamic = 'force-dynamic';

const OCDS_PREFIX = 'ocds:';
const TENDER_PREFIX = 'tender:';

// Single-tender detail endpoint. Reads:
//   - `tender:<ocid>`  → normalized Tender summary
//   - `ocds:<ocid>`    → raw OCDS compiledRelease (items, parties, awards…)
// from KV, with a live MTender fallback when either key is missing (e.g. a
// record that hasn't been touched by sync yet, or local dev without KV).
//
// OCDS 1.1 compiledRelease is the full public record — we pass it through
// untouched so the UI can surface every available field.

type Compiled = Record<string, unknown>;

async function loadFromKv(ocid: string): Promise<{ tender: Tender | null; ocds: Compiled | null } | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    const kv = env?.MTENDER_KV;
    if (!kv) return null;
    const [tenderRaw, ocdsRaw] = await Promise.all([
      kv.get(TENDER_PREFIX + ocid),
      kv.get(OCDS_PREFIX + ocid),
    ]);
    const tender = tenderRaw ? (JSON.parse(tenderRaw) as Tender) : null;
    const ocds = ocdsRaw ? (JSON.parse(ocdsRaw) as Compiled) : null;
    if (!tender && !ocds) return null;
    return { tender, ocds };
  } catch {
    return null;
  }
}

async function loadFromLive(ocid: string): Promise<{ tender: Tender | null; ocds: Compiled | null } | null> {
  const rec = await fetchRecord(ocid);
  if (!rec) return null;
  const compiled = (rec.records?.[0]?.compiledRelease ?? null) as Compiled | null;
  const tender = normalize(rec);
  if (!compiled && !tender) return null;
  return { tender, ocds: compiled };
}

export async function GET(
  _request: Request,
  { params }: { params: { ocid: string } }
) {
  const ocid = decodeURIComponent(params.ocid);
  if (!ocid || ocid.length > 200) {
    return NextResponse.json({ error: 'invalid ocid' }, { status: 400 });
  }

  let source: 'kv' | 'live' = 'kv';
  let data = await loadFromKv(ocid);
  if (!data || (!data.ocds && !data.tender)) {
    source = 'live';
    data = await loadFromLive(ocid);
  } else if (!data.ocds) {
    // KV had the summary but not the raw release (legacy rows). Top it up live.
    const live = await loadFromLive(ocid);
    if (live?.ocds) data = { tender: data.tender, ocds: live.ocds };
  }

  if (!data) {
    return NextResponse.json({ error: 'not found', ocid }, { status: 404 });
  }

  return NextResponse.json(
    { source, ocid, tender: data.tender, ocds: data.ocds },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900',
        'X-Data-Source': source,
      },
    }
  );
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
