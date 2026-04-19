import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { Tender } from '@/lib/types';
import {
  MTENDER_BOOTSTRAP_FROM,
  listTenders,
  fetchRecord,
  normalize,
  mapParallel,
} from '@/lib/mtender';

export const dynamic = 'force-dynamic';

// Per-key KV design: each tender lives at `tender:<ocid>` (value = full Tender
// JSON; metadata = list-view summary). The procurement API reads summaries via
// kv.list() — no value fetches — so CPU cost stays O(1) per batch regardless
// of how many records are in KV. This replaces the old `snapshot:tenders` blob
// that caused 1102 CPU-timeout failures once the snapshot exceeded ~1800 records.
//
// Subrequest budget per batch (free-tier cap: 50):
//   1 list + 10 details + 10 tender: puts + 10 ocds: puts
//   + 1 count get + 1 count put + 1 cursor put + 1 lastSync put = 35

const TENDER_PREFIX = 'tender:';
const CURSOR_KEY = 'state:cursor';
const LAST_SYNC_KEY = 'state:lastSync';
const COUNT_KEY = 'state:count';
const OCDS_PREFIX = 'ocds:';
const DETAIL_CONCURRENCY = 5;
const MAX_DETAIL_FETCHES = 10;

function makeMeta(t: Tender): Record<string, unknown> {
  return {
    id: t.id,
    ocid: t.ocid,
    title: t.title.slice(0, 120),
    titleRu: t.titleRu.slice(0, 120),
    authority: t.authority.slice(0, 80),
    authorityId: t.authorityId,
    sector: t.sector,
    sectorRo: t.sectorRo,
    value: t.value,
    currency: t.currency,
    status: t.status,
    method: t.method,
    publishedDate: t.publishedDate,
    deadlineDate: t.deadlineDate,
    bids: t.bids ?? null,
    winner: t.winner ? t.winner.slice(0, 60) : undefined,
  };
}

export async function GET(request: Request) {
  const { env } = getCloudflareContext();
  const kv = env.MTENDER_KV;
  const expected = env.MTENDER_SYNC_KEY;

  if (!kv) {
    return NextResponse.json({ error: 'MTENDER_KV binding missing' }, { status: 500 });
  }
  if (!expected) {
    return NextResponse.json(
      { error: 'MTENDER_SYNC_KEY secret not configured' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (key !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const started = Date.now();

  const cursorParam = url.searchParams.get('cursor');
  let cursor = cursorParam ?? (await kv.get(CURSOR_KEY)) ?? MTENDER_BOOTSTRAP_FROM;

  const listBefore = cursor;
  const page = await listTenders(cursor);
  const fetched = page.data ?? [];
  const toFetch = fetched.slice(0, MAX_DETAIL_FETCHES);
  const newCursor =
    toFetch.length > 0
      ? toFetch[toFetch.length - 1].date
      : (page.offset ?? cursor);

  const errors: Array<{ ocid: string; err: string }> = [];
  const normalized = await mapParallel(
    toFetch,
    DETAIL_CONCURRENCY,
    async (item): Promise<Tender | null> => {
      const rec = await fetchRecord(item.ocid);
      if (!rec) return null;
      const compiled = rec.records?.[0]?.compiledRelease;
      const tender = normalize(rec);
      if (!tender) return null;

      // Write raw OCDS for future detail pages
      if (compiled) {
        await kv.put(OCDS_PREFIX + item.ocid, JSON.stringify(compiled));
      }

      // Write normalized tender with list-view summary in metadata.
      // KV metadata has a 1024-byte limit — we stay under it by truncating
      // long string fields in makeMeta().
      await kv.put(TENDER_PREFIX + item.ocid, JSON.stringify(tender), {
        metadata: makeMeta(tender),
      });

      return tender;
    },
    (item, err) => errors.push({ ocid: item.ocid, err: String(err).slice(0, 120) })
  );

  const written = normalized.length;

  const prevCountRaw = await kv.get(COUNT_KEY);
  const prevCount = prevCountRaw ? Number(prevCountRaw) : 0;
  const newCount = prevCount + written;

  await kv.put(CURSOR_KEY, newCursor);
  await kv.put(LAST_SYNC_KEY, new Date().toISOString());
  await kv.put(COUNT_KEY, String(newCount));

  const elapsedMs = Date.now() - started;

  return NextResponse.json(
    {
      ok: true,
      listBefore,
      newCursor,
      listed: fetched.length,
      fetched: toFetch.length,
      normalized: written,
      totalCount: newCount,
      errors: errors.slice(0, 5),
      elapsedMs,
      drained: fetched.length < 100 && toFetch.length === fetched.length,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
