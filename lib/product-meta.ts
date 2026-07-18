import { unstable_cache } from "next/cache";
import { readBlobJson } from "./blob-json";
import type { MuscleKey } from "./muscles";
import { detectMuscles } from "./muscles";
import type { Product } from "./data";
import { PRODUCTS_CACHE_TAG } from "./products-store";

// Per-product catalogue metadata managed at /system/catalog: visibility switch,
// extra gallery images, PDF documents, YouTube link and muscle-map highlights.
// Stored as one JSON in Vercel Blob; absent code = enabled with defaults.
export const META_BLOB_PATH = "content/product-meta.json";

export type ProductDocument = { name: string; url: string };

export type ProductMeta = {
  enabled?: boolean; // default true
  gallery?: string[]; // blob URLs of extra images shown under the main picture
  documents?: ProductDocument[];
  youtubeUrl?: string;
  muscles?: MuscleKey[]; // manual override of the auto-detected highlights
};

export type ProductMetaMap = Record<string, ProductMeta>;

export async function fetchProductMetaUncached(): Promise<ProductMetaMap> {
  return (await readBlobJson<ProductMetaMap>(META_BLOB_PATH)) ?? {};
}

// revalidate: a transient bad read (CDN staleness, bot-check page) heals itself
// within 5 minutes even without an admin save triggering updateTag.
export const loadProductMeta = unstable_cache(fetchProductMetaUncached, ["product-meta"], {
  tags: [PRODUCTS_CACHE_TAG],
  revalidate: 300,
});

export function isEnabled(meta: ProductMetaMap, code: string) {
  return meta[code]?.enabled !== false;
}

export async function filterEnabled(products: Product[]): Promise<Product[]> {
  const meta = await loadProductMeta();
  return products.filter((product) => isEnabled(meta, product.code));
}

export function effectiveMuscles(product: Product, meta: ProductMeta | undefined): MuscleKey[] {
  return meta?.muscles ?? detectMuscles(product.muscles);
}

export function youtubeVideoId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/);
  return match ? match[1] : null;
}
