import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Public read of sync state, so the footer can render "last sync · N records
// · cursor at YYYY-MM-DD" without exposing the write-protected sync key.

const CURSOR_KEY = 'state:cursor';
const LAST_SYNC_KEY = 'state:lastSync';
const COUNT_KEY = 'state:count';

export async function GET() {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    const kv = env?.MTENDER_KV;
    if (!kv) {
      return NextResponse.json(
        { source: 'seed', lastSync: null, count: null, cursor: null },
        { headers: { 'Cache-Control': 'public, max-age=300' } }
      );
    }
    const [lastSync, count, cursor] = await Promise.all([
      kv.get(LAST_SYNC_KEY),
      kv.get(COUNT_KEY),
      kv.get(CURSOR_KEY),
    ]);
    return NextResponse.json(
      {
        source: 'kv',
        lastSync: lastSync ?? null,
        count: count ? Number(count) : null,
        cursor: cursor ?? null,
      },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch {
    return NextResponse.json(
      { source: 'seed', lastSync: null, count: null, cursor: null },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  }
}
