import { unstable_cache } from "next/cache";
import { readBlobJson } from "./blob-json";
import { products as baseProducts, type Product } from "./data";

// Admin bulk-import of product data: an uploaded XLSX becomes a diffs-only
// overrides JSON in Vercel Blob, merged over data/products.json at read time.
// An empty cell in the upload reverts that field to the built-in value.
export const PRODUCTS_BLOB_PATH = "content/product-overrides.json";
export const PRODUCTS_REPORT_BLOB_PATH = "content/product-import-report.json";
export const PRODUCTS_CACHE_TAG = "products";

export type ProductOverride = Record<string, string | number>;
export type ProductOverrides = Record<string, ProductOverride>;

export type ImportReport = {
  at: string;
  fileName: string;
  rowsRead: number;
  productsChanged: number;
  fieldsOverridden: number;
  errors: string[];
};

export type ColumnSpec = {
  key: string;
  header: string;
  type: "text" | "number";
  get: (product: Product) => string | number | null;
};

// Flat column model for the spreadsheet; nested fields get explicit keys.
export const productColumns: ColumnSpec[] = [
  { key: "priceCzk", header: "Price CZK excl. VAT", type: "number", get: () => null }, // filled from pricelist at template time
  { key: "nameEn", header: "Name EN", type: "text", get: (p) => p.nameEn },
  { key: "nameCs", header: "Name CS", type: "text", get: (p) => p.nameCs },
  { key: "descriptionEn", header: "Description EN", type: "text", get: (p) => p.descriptionEn },
  { key: "descriptionCs", header: "Description CS", type: "text", get: (p) => p.descriptionCs },
  { key: "muscles", header: "Target muscles", type: "text", get: (p) => p.muscles },
  { key: "bodyFocus", header: "Body focus", type: "text", get: (p) => p.bodyFocus },
  { key: "secondaryFocus", header: "Secondary focus", type: "text", get: (p) => p.secondaryFocus },
  { key: "movementPatterns", header: "Movement patterns", type: "text", get: (p) => p.movementPatterns },
  { key: "position", header: "Exercise position", type: "text", get: (p) => p.position },
  { key: "simultaneousUsers", header: "Simultaneous users", type: "text", get: (p) => p.simultaneousUsers },
  { key: "loadSpecification", header: "Load specification", type: "text", get: (p) => p.loadSpecification },
  { key: "totalPlateLoadKg", header: "Total plate load kg", type: "number", get: (p) => (typeof p.totalPlateLoadKg === "number" ? p.totalPlateLoadKg : null) },
  { key: "weightKg", header: "Weight kg", type: "number", get: (p) => p.weightKg },
  { key: "footprint", header: "Footprint m2", type: "number", get: (p) => p.footprint },
  { key: "dimLength", header: "Length mm", type: "number", get: (p) => p.dimensions.length },
  { key: "dimWidth", header: "Width mm", type: "number", get: (p) => p.dimensions.width },
  { key: "dimHeight", header: "Height mm", type: "number", get: (p) => p.dimensions.height },
  { key: "matFrame", header: "Material frame", type: "text", get: (p) => p.materials.frame },
  { key: "matRails", header: "Material rails", type: "text", get: (p) => p.materials.rails },
  { key: "matSmallParts", header: "Material small parts", type: "text", get: (p) => p.materials.smallParts },
  { key: "matFinish", header: "Material finish", type: "text", get: (p) => p.materials.finish },
  { key: "covUpper", header: "Coverage upper", type: "number", get: (p) => p.coverage.upper },
  { key: "covLower", header: "Coverage lower", type: "number", get: (p) => p.coverage.lower },
  { key: "covCore", header: "Coverage core", type: "number", get: (p) => p.coverage.core },
  { key: "covCardio", header: "Coverage cardio", type: "number", get: (p) => p.coverage.cardio },
  { key: "scoreVariety", header: "Score variety", type: "number", get: (p) => p.scores.variety },
  { key: "scoreBeginner", header: "Score beginner", type: "number", get: (p) => p.scores.beginner },
  { key: "scoreAccessibility", header: "Score accessibility", type: "number", get: (p) => p.scores.accessibility },
  { key: "scoreThroughput", header: "Score throughput", type: "number", get: (p) => p.scores.throughput },
  { key: "scoreSpace", header: "Score space", type: "number", get: (p) => p.scores.space },
  { key: "scoreComplement", header: "Score complement", type: "number", get: (p) => p.scores.complement },
  { key: "scoreAffordability", header: "Score affordability", type: "number", get: (p) => p.scores.affordability },
  { key: "websiteUrl", header: "Website URL", type: "text", get: (p) => p.websiteUrl },
];

export async function fetchProductOverridesUncached(): Promise<ProductOverrides> {
  return (await readBlobJson<ProductOverrides>(PRODUCTS_BLOB_PATH)) ?? {};
}

export async function fetchImportReport(): Promise<ImportReport | null> {
  return readBlobJson<ImportReport>(PRODUCTS_REPORT_BLOB_PATH);
}

export const loadProductOverrides = unstable_cache(fetchProductOverridesUncached, ["product-overrides"], {
  tags: [PRODUCTS_CACHE_TAG],
  revalidate: 300,
});

function asText(value: string | number | undefined, fallback: string) {
  return typeof value === "string" ? value : fallback;
}
function asNumber(value: string | number | undefined, fallback: number | null) {
  return typeof value === "number" ? value : fallback;
}

export function applyOverride(product: Product, o: ProductOverride | undefined): Product {
  if (!o) return product;
  return {
    ...product,
    nameEn: asText(o.nameEn, product.nameEn),
    nameCs: asText(o.nameCs, product.nameCs),
    descriptionEn: asText(o.descriptionEn, product.descriptionEn),
    descriptionCs: asText(o.descriptionCs, product.descriptionCs),
    muscles: asText(o.muscles, product.muscles),
    bodyFocus: asText(o.bodyFocus, product.bodyFocus),
    secondaryFocus: asText(o.secondaryFocus, product.secondaryFocus),
    movementPatterns: asText(o.movementPatterns, product.movementPatterns),
    position: asText(o.position, product.position),
    simultaneousUsers: asText(o.simultaneousUsers, product.simultaneousUsers),
    loadSpecification: asText(o.loadSpecification, product.loadSpecification),
    totalPlateLoadKg: asNumber(o.totalPlateLoadKg, typeof product.totalPlateLoadKg === "number" ? product.totalPlateLoadKg : null),
    weightKg: asNumber(o.weightKg, product.weightKg),
    footprint: asNumber(o.footprint, product.footprint),
    dimensions: {
      length: asNumber(o.dimLength, product.dimensions.length),
      width: asNumber(o.dimWidth, product.dimensions.width),
      height: asNumber(o.dimHeight, product.dimensions.height),
    },
    materials: {
      frame: asText(o.matFrame, product.materials.frame),
      rails: asText(o.matRails, product.materials.rails),
      smallParts: asText(o.matSmallParts, product.materials.smallParts),
      finish: asText(o.matFinish, product.materials.finish),
    },
    coverage: {
      upper: asNumber(o.covUpper, product.coverage.upper) ?? product.coverage.upper,
      lower: asNumber(o.covLower, product.coverage.lower) ?? product.coverage.lower,
      core: asNumber(o.covCore, product.coverage.core) ?? product.coverage.core,
      cardio: asNumber(o.covCardio, product.coverage.cardio) ?? product.coverage.cardio,
    },
    scores: {
      variety: asNumber(o.scoreVariety, product.scores.variety) ?? product.scores.variety,
      beginner: asNumber(o.scoreBeginner, product.scores.beginner) ?? product.scores.beginner,
      accessibility: asNumber(o.scoreAccessibility, product.scores.accessibility) ?? product.scores.accessibility,
      throughput: asNumber(o.scoreThroughput, product.scores.throughput) ?? product.scores.throughput,
      space: asNumber(o.scoreSpace, product.scores.space) ?? product.scores.space,
      complement: asNumber(o.scoreComplement, product.scores.complement) ?? product.scores.complement,
      affordability: asNumber(o.scoreAffordability, product.scores.affordability) ?? product.scores.affordability,
    },
    websiteUrl: asText(o.websiteUrl, product.websiteUrl),
  };
}

export async function getProducts(): Promise<Product[]> {
  const overrides = await loadProductOverrides();
  return baseProducts.map((product) => applyOverride(product, overrides[product.code]));
}

export async function getMergedProduct(lineSlug: string, productSlug: string) {
  return (await getProducts()).find((p) => p.lineSlug === lineSlug && p.slug === productSlug);
}

export async function getMergedProductsByLine(lineSlug: string) {
  return (await getProducts()).filter((p) => p.lineSlug === lineSlug);
}
