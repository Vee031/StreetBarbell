import { unstable_cache } from "next/cache";
import { readBlobJsonForUpdate } from "./blob-json";
import type { MuscleKey } from "./muscles";
import { detectMuscles } from "./muscles";
import { MUSCLE_SHAPES, shapeIndicesForKeys } from "./muscle-figure";
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
  muscles?: MuscleKey[]; // legacy: whole-group highlight selection (pre shape editor)
  muscleShapes?: number[]; // manual per-region selection: indices into MUSCLE_SHAPES
  components?: string[]; // product codes this combination is built from, in display order
};

export type ProductMetaMap = Record<string, ProductMeta>;

// Strict (throws when the store is unreachable) — admin actions read through
// this; an outage can never make a save wipe the catalogue meta.
export async function fetchProductMetaUncached(): Promise<ProductMetaMap> {
  return (await readBlobJsonForUpdate<ProductMetaMap>(META_BLOB_PATH)) ?? {};
}

// Lenient cached path for public rendering; revalidate self-heals bad reads.
export const loadProductMeta = unstable_cache(
  async (): Promise<ProductMetaMap> => {
    try {
      return await fetchProductMetaUncached();
    } catch {
      return {};
    }
  },
  ["product-meta"],
  { tags: [PRODUCTS_CACHE_TAG], revalidate: 300 },
);

export function isEnabled(meta: ProductMetaMap, code: string) {
  return meta[code]?.enabled !== false;
}

export async function filterEnabled(products: Product[]): Promise<Product[]> {
  const meta = await loadProductMeta();
  return products.filter((product) => isEnabled(meta, product.code));
}

// The highlighted regions to show, in priority order:
//   1. an explicit per-region selection saved from the visual editor
//   2. a legacy whole-group selection (older saves)
//   3. auto-detection from the product's "Target muscles" text
export function effectiveMuscleShapes(product: Product, meta: ProductMeta | undefined): number[] {
  if (meta?.muscleShapes) return meta.muscleShapes.filter((i) => i >= 0 && i < MUSCLE_SHAPES.length);
  const keys = meta?.muscles ?? detectMuscles(product.muscles);
  return shapeIndicesForKeys(keys);
}

export function youtubeVideoId(url: string | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/);
  return match ? match[1] : null;
}
