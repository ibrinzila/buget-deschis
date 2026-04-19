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

// One batch does: advance cursor by one list page (≤100 OCIDs), parallel-fetch
// those detail records, normalize, merge into the snapshot blob, persist.
// Designed to stay inside the 30s Worker CPU ceiling on the free tier.

const SNAPSHOT_KEY = 'snapshot:tenders';
const CURSOR_KEY = 'state:cursor';
const DETAIL_CONCURRENCY = 10;

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

  let cursor = (await kv.get(CURSOR_KEY)) ?? MTENDER_BOOTSTRAP_FROM;

  const listBefore = cursor;
  const page = await listTenders(cursor);
  const fetched = page.data ?? [];
  const newCursor = page.offset ?? cursor;

  // Detail fetches in parallel, skipping 404s and logging per-record failures.
  const errors: Array<{ ocid: string; err: string }> = [];
  const normalized = await mapParallel(
    fetched,
    DETAIL_CONCURRENCY,
    async (item): Promise<Tender | null> => {
      const rec = await fetchRecord(item.ocid);
      if (!rec) return null;
      return normalize(rec);
    },
    (item, err) => errors.push({ ocid: item.ocid, err: String(err).slice(0, 120) })
  );

  // Merge into the snapshot blob. Dedup by ocid — latest wins.
  const existingRaw = await kv.get(SNAPSHOT_KEY, { type: 'json' });
  const existing = (Array.isArray(existingRaw) ? (existingRaw as Tender[]) : []);
  const byOcid = new Map<string, Tender>();
  for (const t of existing) byOcid.set(t.ocid, t);
  for (const t of normalized) byOcid.set(t.ocid, t);
  const merged = Array.from(byOcid.values()).sort((a, b) =>
    b.publishedDate.localeCompare(a.publishedDate)
  );

  await kv.put(SNAPSHOT_KEY, JSON.stringify(merged));
  await kv.put(CURSOR_KEY, newCursor);

  const elapsedMs = Date.now() - started;

  return NextResponse.json(
    {
      ok: true,
      listBefore,
      newCursor,
      listed: fetched.length,
      normalized: normalized.length,
      snapshotSize: merged.length,
      errors: errors.slice(0, 5),
      elapsedMs,
      // Heuristic: if we got a full 100-item page, there's almost certainly more
      // to pull; caller can loop until listed < 100.
      drained: fetched.length < 100,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
