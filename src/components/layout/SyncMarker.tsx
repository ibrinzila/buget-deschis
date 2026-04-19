'use client';

import { useEffect, useState } from 'react';

interface Meta {
  source: 'kv' | 'seed';
  lastSync: string | null;
  count: number | null;
  cursor: string | null;
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} · ${pad(
    d.getUTCHours()
  )}:${pad(d.getUTCMinutes())} UTC`;
}

function fmtCount(n: number): string {
  return new Intl.NumberFormat('ro-MD').format(n);
}

export default function SyncMarker({ fallback }: { fallback: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/mtender-meta')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Meta | null) => {
        if (!cancelled && data) setMeta(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!meta || meta.source !== 'kv' || !meta.lastSync) {
    return <span>{fallback}</span>;
  }

  const parts: string[] = [`MTender sync: ${fmtTimestamp(meta.lastSync)}`];
  if (meta.count !== null) parts.push(`${fmtCount(meta.count)} records`);
  if (meta.cursor) parts.push(`cursor @ ${meta.cursor.slice(0, 10)}`);
  return <span>{parts.join(' · ')}</span>;
}
