import type { Product } from "@/lib/data";
import { loadProductOverrides } from "@/lib/products-store";

// 2026 pricelist: one CZK price (excl. VAT) per product code. Machines from the
// official "Pricelist StreetBarbell 2026" PDF carry their listed price; all
// other machines carry distributor powder-coating price × 2 (fixed at 25 CZK/EUR,
// rounded to whole thousands). Baseline lives in STREETBARBELL_PRICELIST_JSON;
// admin XLSX uploads (/system/products) override per code via Vercel Blob.
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

export async function getEffectivePricelist(): Promise<Record<string, number>> {
  const pricelist = { ...getPricelist() };
  const overrides = await loadProductOverrides();
  for (const [code, override] of Object.entries(overrides)) {
    if (typeof override.priceCzk === "number") pricelist[code] = override.priceCzk;
  }
  return pricelist;
}

export async function attachPrices(products: Product[]): Promise<PricedProduct[]> {
  const pricelist = await getEffectivePricelist();
  return products.map((product) => ({ ...product, priceCzk: pricelist[product.code] ?? null }));
}
