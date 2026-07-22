import { unstable_cache } from "next/cache";
import { readBlobJson } from "./blob-json";
import { PRODUCTS_CACHE_TAG } from "./cache-tags";
import { products as baseProducts, productLines, type Product } from "./data";
import { loadProductGroups, type ProductGroupsData } from "./product-groups";

// Admin bulk-import of product data: an uploaded XLSX becomes a diffs-only
// overrides JSON in Vercel Blob, merged over data/products.json at read time.
// An empty cell in the upload reverts that field to the built-in value.
export const PRODUCTS_BLOB_PATH = "content/product-overrides.json";
export const PRODUCTS_REPORT_BLOB_PATH = "content/product-import-report.json";
export const CUSTOM_PRODUCTS_BLOB_PATH = "content/custom-products.json";
export { PRODUCTS_CACHE_TAG };

// --- Product categories -----------------------------------------------------
// A product's category (its `lineSlug`) is either one of the 9 built-in lines or
// an admin-created product group (e.g. "with-workout") — groups behave exactly
// like lines: the category is set on the product card, the group page lists its
// products, and one product belongs to exactly one category.
export type CategoryDef = { slug: string; nameEn: string; nameCs: string; image?: string };

export function buildCategoryMap(groupsData: ProductGroupsData): Map<string, CategoryDef> {
  const map = new Map<string, CategoryDef>();
  for (const line of productLines) map.set(line.slug, { slug: line.slug, nameEn: line.nameEn, nameCs: line.nameCs, image: line.image });
  for (const category of groupsData.categories) {
    for (const group of category.groups) {
      if (group.type === "products" && !map.has(group.id)) {
        map.set(group.id, { slug: group.id, nameEn: group.labelEn, nameCs: group.labelCs });
      }
    }
  }
  return map;
}

const FALLBACK_PRODUCT_IMAGE = "/images/photos/park-city.webp";

// The canonical exercise-position values used across the catalogue. The recommender
// matches them by keyword (/seat/, /stand/, lying|bench), so all of these work with it.
export const POSITION_OPTIONS = [
  "Standing",
  "Seated",
  "Likely Seated",
  "Lying / Bench",
  "Hanging / Bodyweight",
  "Mixed / Bodyweight",
  "Mixed / Multiple",
  "Not applicable",
  "Unknown",
];

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
  { key: "lineSlug", header: "Line", type: "text", get: (p) => p.lineSlug }, // move a machine between lines (valid slugs only)
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

// --- Admin-created products -------------------------------------------------
// Machines added at /system/catalog/new. Stored as a compact record in Blob and
// expanded into full Product objects at read time. They appear on line/group
// pages and product detail pages, but NOT in the configurator (no scores/price).
export type CustomProductRecord = {
  code: string;
  nameEn: string;
  nameCs: string;
  lineSlug: string;
  descriptionEn: string;
  descriptionCs: string;
  position: string;
  image: string; // blob URL; "" = fall back to the line photo
  createdAt: string;
};
export type CustomProducts = Record<string, CustomProductRecord>;

export function productSlugFor(code: string, nameEn: string) {
  return `${code} ${nameEn}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function customToProduct(record: CustomProductRecord, categories: Map<string, CategoryDef>): Product {
  const category = categories.get(record.lineSlug);
  return {
    code: record.code,
    nameEn: record.nameEn,
    nameCs: record.nameCs || record.nameEn,
    slug: productSlugFor(record.code, record.nameEn),
    line: category?.nameEn ?? record.lineSlug,
    lineCs: category?.nameCs ?? record.lineSlug,
    lineSlug: record.lineSlug,
    descriptionEn: record.descriptionEn,
    descriptionCs: record.descriptionCs || record.descriptionEn,
    muscles: "",
    bodyFocus: "",
    secondaryFocus: "",
    movementPatterns: "",
    position: record.position,
    positionConfidence: "",
    workoutOverlap: "",
    workoutComplement: "",
    versatility: "",
    specialization: "",
    simultaneousUsers: "",
    footprint: null,
    spaceEfficiency: "",
    coverage: { upper: 0, lower: 0, core: 0, cardio: 0 },
    scores: { variety: 0, beginner: 0, accessibility: 0, throughput: 0, space: 0, complement: 0, affordability: 0 },
    dimensions: { length: null, width: null, height: null },
    weightKg: null,
    loadSpecification: "",
    totalPlateLoadKg: null,
    materials: { frame: "", rails: "", smallParts: "", finish: "" },
    prices: { pcBase: null, pcDiscount: null, tcBase: null, tcDiscount: null, hdgBase: null, hdgDiscount: null },
    websiteUrl: "",
    image: record.image || category?.image || FALLBACK_PRODUCT_IMAGE,
    categoryImage: category?.image || record.image || FALLBACK_PRODUCT_IMAGE,
    detailStatus: "custom",
    classificationConfidence: "",
    custom: true,
  };
}

export async function fetchCustomProductsUncached(): Promise<CustomProducts> {
  return (await readBlobJson<CustomProducts>(CUSTOM_PRODUCTS_BLOB_PATH)) ?? {};
}

export const loadCustomProducts = unstable_cache(fetchCustomProductsUncached, ["custom-products"], {
  tags: [PRODUCTS_CACHE_TAG],
  revalidate: 300,
});

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

export function applyOverride(product: Product, o: ProductOverride | undefined, categories: Map<string, CategoryDef>): Product {
  if (!o) return product;
  // Category move: only valid line/group slugs apply; names follow the new category.
  const movedCategory = typeof o.lineSlug === "string" ? categories.get(o.lineSlug) : undefined;
  return {
    ...product,
    ...(movedCategory ? { lineSlug: movedCategory.slug, line: movedCategory.nameEn, lineCs: movedCategory.nameCs } : {}),
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
  const [overrides, custom, groupsData] = await Promise.all([loadProductOverrides(), loadCustomProducts(), loadProductGroups()]);
  const categories = buildCategoryMap(groupsData);
  const all = [...baseProducts, ...Object.values(custom).map((record) => customToProduct(record, categories))];
  return all.map((product) => applyOverride(product, overrides[product.code], categories));
}

export async function getMergedProduct(lineSlug: string, productSlug: string) {
  return (await getProducts()).find((p) => p.lineSlug === lineSlug && p.slug === productSlug);
}

export async function getMergedProductsByLine(lineSlug: string) {
  return (await getProducts()).filter((p) => p.lineSlug === lineSlug);
}
