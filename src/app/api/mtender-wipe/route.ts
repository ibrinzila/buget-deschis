import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

// One-shot (or as-needed) wipe to restart the bootstrap from scratch. Deletes
// the normalized snapshot blob + cursor + sync metadata. Per-OCID `ocds:*`
// keys are intentionally left alone — they're harmless if orphaned (detail
// pages 404 gracefully) and re-walking MTender will overwrite them anyway.
//
// Protected by MTENDER_SYNC_KEY. Idempotent: running twice is a no-op after
// the first call.

const SNAPSHOT_KEY = 'snapshot:tenders';
const CURSOR_KEY = 'state:cursor';
const LAST_SYNC_KEY = 'state:lastSync';
const COUNT_KEY = 'state:count';

export async function POST(request: Request) {
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

  const existingRaw = await kv.get(SNAPSHOT_KEY, { type: 'json' });
  const before = Array.isArray(existingRaw) ? existingRaw.length : 0;

  await Promise.all([
    kv.delete(SNAPSHOT_KEY),
    kv.delete(CURSOR_KEY),
    kv.delete(LAST_SYNC_KEY),
    kv.delete(COUNT_KEY),
  ]);

  return NextResponse.json(
    {
      ok: true,
      wipedSnapshotCount: before,
      note: 'snapshot + cursor + meta deleted. Orphan ocds:* keys left in place — sync will overwrite them.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
