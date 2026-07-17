import type { Product } from "@/lib/data";

// 2026 pricelist: one CZK price (excl. VAT) per product code. Machines from the
// official "Pricelist StreetBarbell 2026" PDF carry their listed price; all
// other machines carry distributor powder-coating price × 2 (fixed at 25 CZK/EUR,
// rounded to whole thousands). Values live only in STREETBARBELL_PRICELIST_JSON.
export type PricedProduct = Product & { priceCzk: number | null };

export function getPricelist(): Record<string, number> {
  const raw = process.env.STREETBARBELL_PRICELIST_JSON;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    throw new Error("STREETBARBELL_PRICELIST_JSON is not valid JSON.");
  }
}

export function attachPrices(products: Product[]): PricedProduct[] {
  const pricelist = getPricelist();
  return products.map((product) => ({ ...product, priceCzk: pricelist[product.code] ?? null }));
}
