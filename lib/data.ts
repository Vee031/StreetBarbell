import productsJson from "@/data/products.json";
import linesJson from "@/data/lines.json";

export type PriceKey = "pcBase" | "pcDiscount" | "tcBase" | "tcDiscount" | "hdgBase" | "hdgDiscount";

export type Product = {
  code: string;
  nameEn: string;
  nameCs: string;
  slug: string;
  line: string;
  lineCs: string;
  lineSlug: string;
  descriptionEn: string;
  descriptionCs: string;
  muscles: string;
  bodyFocus: string;
  secondaryFocus: string;
  movementPatterns: string;
  position: string;
  positionConfidence: string;
  workoutOverlap: string;
  workoutComplement: string;
  versatility: string;
  specialization: string;
  simultaneousUsers: string;
  footprint: number | null;
  spaceEfficiency: string;
  coverage: { upper: number; lower: number; core: number; cardio: number };
  scores: {
    variety: number;
    beginner: number;
    accessibility: number;
    throughput: number;
    space: number;
    complement: number;
    affordability: number;
  };
  dimensions: { length: number | null; width: number | null; height: number | null };
  weightKg: number | null;
  loadSpecification: string;
  totalPlateLoadKg: number | string | null;
  materials: { frame: string; rails: string; smallParts: string; finish: string };
  prices: Record<PriceKey, number | null>;
  websiteUrl: string;
  image: string;
  categoryImage: string;
  detailStatus: string;
  classificationConfidence: string;
  custom?: boolean; // true = created in /system (admin), not part of the built-in 116
};

export type ProductLine = {
  nameEn: string;
  nameCs: string;
  slug: string;
  count: number;
  image: string;
};

export const products = productsJson as unknown as Product[];
export const productLines = linesJson as unknown as ProductLine[];

// Machine names are shown in their original English on both language
// versions (owner decision 2026-07-17); descriptions stay localized.
export function getProductName(product: Product) {
  return product.nameEn;
}

export function getProductDescription(product: Product, locale: "en" | "cs") {
  return locale === "cs" ? product.descriptionCs : product.descriptionEn;
}

export function getProductsByLine(lineSlug: string) {
  return products.filter((product) => product.lineSlug === lineSlug);
}

export function getProduct(lineSlug: string, productSlug: string) {
  return products.find((product) => product.lineSlug === lineSlug && product.slug === productSlug);
}
