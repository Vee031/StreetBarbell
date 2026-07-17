import { head } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { dictionaries, type Locale } from "./i18n";

// Admin-edited text overrides live in a single JSON blob; anything not
// overridden falls back to the defaults compiled into lib/i18n.ts.
export const TEXTS_BLOB_PATH = "content/site-texts.json";
export const TEXTS_CACHE_TAG = "site-texts";

export type SectionKey = keyof (typeof dictionaries)["en"];
export type TextOverrides = Partial<Record<Locale, Partial<Record<SectionKey, Record<string, string>>>>>;
export type SiteTexts = { [S in SectionKey]: { [K in keyof (typeof dictionaries)["en"][S]]: string } };

export async function fetchOverridesUncached(): Promise<TextOverrides> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return {};
  try {
    // Timeboxed so an unreachable blob store degrades to defaults instead of
    // hanging every page render.
    const meta = await head(TEXTS_BLOB_PATH, { abortSignal: AbortSignal.timeout(5000) });
    // Cache-bust the blob CDN: right after a save it can still serve the
    // previous JSON, which would otherwise get locked into unstable_cache.
    const bustedUrl = `${meta.url}${meta.url.includes("?") ? "&" : "?"}v=${meta.uploadedAt.getTime()}`;
    const response = await fetch(bustedUrl, {
      cache: "no-store",
      headers: { "cache-control": "no-cache" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return {};
    return (await response.json()) as TextOverrides;
  } catch {
    // Blob missing (nothing saved yet) or store unreachable — serve defaults.
    return {};
  }
}

export const loadOverrides = unstable_cache(fetchOverridesUncached, ["site-text-overrides"], {
  tags: [TEXTS_CACHE_TAG],
});

export async function getSiteTexts(locale: Locale): Promise<SiteTexts> {
  const overrides = await loadOverrides();
  const base = dictionaries[locale];
  const merged: Record<string, Record<string, string>> = {};
  for (const [section, entries] of Object.entries(base)) {
    merged[section] = { ...entries, ...(overrides[locale]?.[section as SectionKey] ?? {}) };
  }
  return merged as SiteTexts;
}
