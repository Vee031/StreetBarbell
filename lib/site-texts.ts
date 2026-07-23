import { unstable_cache } from "next/cache";
import { readBlobJsonForUpdate } from "./blob-json";
import { dictionaries, type Locale } from "./i18n";

// Admin-edited text overrides live in a single JSON blob; anything not
// overridden falls back to the defaults compiled into lib/i18n.ts.
export const TEXTS_BLOB_PATH = "content/site-texts.json";
export const TEXTS_CACHE_TAG = "site-texts";

export type SectionKey = keyof (typeof dictionaries)["en"];
export type TextOverrides = Partial<Record<Locale, Partial<Record<SectionKey, Record<string, string>>>>>;
export type SiteTexts = { [S in SectionKey]: { [K in keyof (typeof dictionaries)["en"][S]]: string } };

// Strict (throws when the store is unreachable) — used by the /system/texts
// editor so a save can never overwrite good overrides with an empty read.
export async function fetchOverridesUncached(): Promise<TextOverrides> {
  return (await readBlobJsonForUpdate<TextOverrides>(TEXTS_BLOB_PATH)) ?? {};
}

// Lenient cached path for public rendering: on failure the site simply shows
// the built-in default texts instead of crashing.
export const loadOverrides = unstable_cache(
  async (): Promise<TextOverrides> => {
    try {
      return await fetchOverridesUncached();
    } catch {
      return {};
    }
  },
  ["site-text-overrides"],
  { tags: [TEXTS_CACHE_TAG], revalidate: 300 },
);

export async function getSiteTexts(locale: Locale): Promise<SiteTexts> {
  const overrides = await loadOverrides();
  const base = dictionaries[locale];
  const merged: Record<string, Record<string, string>> = {};
  for (const [section, entries] of Object.entries(base)) {
    merged[section] = { ...entries, ...(overrides[locale]?.[section as SectionKey] ?? {}) };
  }
  return merged as SiteTexts;
}
