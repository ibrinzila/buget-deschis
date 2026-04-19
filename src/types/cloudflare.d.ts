// Extend as bindings are added to wrangler.jsonc.
// Minimal inline KVNamespace type so we don't need to pull in
// @cloudflare/workers-types at runtime.
type KVValue = string | ArrayBuffer | ReadableStream;
interface KVNamespace {
  get(key: string, options?: { type?: 'text' }): Promise<string | null>;
  get(key: string, options: { type: 'json' }): Promise<unknown | null>;
  put(
    key: string,
    value: KVValue,
    options?: { expiration?: number; expirationTtl?: number; metadata?: unknown }
  ): Promise<void>;
  delete(key: string): Promise<void>;
  list<Meta = unknown>(options?: {
    prefix?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ keys: Array<{ name: string; metadata?: Meta }>; list_complete: boolean; cursor?: string }>;
}

interface CloudflareEnv {
  ASSETS: { fetch: typeof fetch };
  MTENDER_KV: KVNamespace;
  MTENDER_SYNC_KEY?: string;
}
