import type { PriceKey, Product } from "@/lib/data";

export type PrivatePricing = Record<string, Record<PriceKey, number | null>>;

export function getPrivatePricing(): PrivatePricing {
  const raw = process.env.STREETBARBELL_PRICING_JSON;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PrivatePricing;
  } catch {
    throw new Error("STREETBARBELL_PRICING_JSON is not valid JSON.");
  }
}

export function attachPrivatePrices(products: Product[]) {
  const pricing = getPrivatePricing();
  return products.map((product) => ({
    ...product,
    prices: pricing[product.code] ?? product.prices,
  }));
}
