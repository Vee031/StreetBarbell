import { head, put } from "@vercel/blob";

// Small JSON-in-Vercel-Blob helper with a write-through, per-instance cache.
// The blob CDN can serve the previous version for a few seconds after a write;
// naive read-modify-write cycles can then lose updates. Writes remember the
// exact payload in module scope, and reads prefer that copy unless the blob is
// genuinely newer (written by another instance). 2s tolerance covers clock skew.
// On globalThis so every bundle/module instance in the process shares one cache
// (Next compiles separate module graphs per route bundle).
const globalStore = globalThis as typeof globalThis & { __blobJsonWrites?: Map<string, { at: number; data: unknown }> };
const lastWritten = (globalStore.__blobJsonWrites ??= new Map<string, { at: number; data: unknown }>());
const WRITE_CACHE_TTL_MS = 5 * 60 * 1000;

export async function readBlobJson<T>(pathname: string): Promise<T | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const local = lastWritten.get(pathname);
  try {
    const meta = await head(pathname, { abortSignal: AbortSignal.timeout(5000) });
    if (local && Date.now() - local.at < WRITE_CACHE_TTL_MS && meta.uploadedAt.getTime() <= local.at + 2000) {
      return local.data as T;
    }
    const bustedUrl = `${meta.url}${meta.url.includes("?") ? "&" : "?"}v=${meta.uploadedAt.getTime()}`;
    const response = await fetch(bustedUrl, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return (local?.data as T) ?? null;
    return (await response.json()) as T;
  } catch {
    // Blob missing (nothing saved yet) or store unreachable.
    if (local && Date.now() - local.at < WRITE_CACHE_TTL_MS) return local.data as T;
    return null;
  }
}

// Strict read for read-modify-write flows (admin saves). Returns null ONLY when
// the blob genuinely does not exist yet; any other failure — store suspended,
// bot-check page instead of JSON, network error — THROWS, so an admin action
// fails loudly instead of "reading" an empty store and overwriting good data.
export class BlobUnavailableError extends Error {}

export async function readBlobJsonForUpdate<T>(pathname: string): Promise<T | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new BlobUnavailableError("Blob token is not configured.");
  const local = lastWritten.get(pathname);
  let meta;
  try {
    meta = await head(pathname, { abortSignal: AbortSignal.timeout(5000) });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not.?found|does not exist/i.test(message)) return null; // never written yet
    if (local && Date.now() - local.at < WRITE_CACHE_TTL_MS) return local.data as T;
    throw new BlobUnavailableError(`Blob head failed for ${pathname}: ${message}`);
  }
  if (local && Date.now() - local.at < WRITE_CACHE_TTL_MS && meta.uploadedAt.getTime() <= local.at + 2000) {
    return local.data as T;
  }
  const bustedUrl = `${meta.url}${meta.url.includes("?") ? "&" : "?"}v=${meta.uploadedAt.getTime()}`;
  const response = await fetch(bustedUrl, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
    signal: AbortSignal.timeout(5000),
  }).catch((error) => {
    throw new BlobUnavailableError(`Blob fetch failed for ${pathname}: ${error instanceof Error ? error.message : error}`);
  });
  if (!response.ok) throw new BlobUnavailableError(`Blob fetch for ${pathname} returned ${response.status}.`);
  try {
    return (await response.json()) as T;
  } catch {
    // e.g. "Your store is blocked" HTML/text served instead of the JSON.
    throw new BlobUnavailableError(`Blob content for ${pathname} is not valid JSON (store blocked or bot-checked).`);
  }
}

export async function writeBlobJson(pathname: string, data: unknown) {
  await put(pathname, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    abortSignal: AbortSignal.timeout(10000),
  });
  lastWritten.set(pathname, { at: Date.now(), data });
}
