import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const dynamic = 'force-dynamic';

// One-shot (or as-needed) wipe to restart the bootstrap from scratch. Deletes
// the cursor + sync metadata so the next sync run starts from the beginning.
// Individual `tender:*` and `ocds:*` keys are left in place — they're
// overwritten as sync revisits each OCID and cause no harm in the meantime.
// Also deletes any legacy `snapshot:tenders` blob from the old schema.

const LEGACY_SNAPSHOT_KEY = 'snapshot:tenders'; // old blob schema — clean up if present
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

  await Promise.all([
    kv.delete(LEGACY_SNAPSHOT_KEY),
    kv.delete(CURSOR_KEY),
    kv.delete(LAST_SYNC_KEY),
    kv.delete(COUNT_KEY),
  ]);

  return NextResponse.json(
    {
      ok: true,
      note: 'cursor + meta + legacy snapshot deleted. tender:* and ocds:* keys left in place — sync will overwrite them.',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
