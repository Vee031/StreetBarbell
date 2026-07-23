import { NextResponse } from "next/server";
import { filterEnabled } from "@/lib/product-meta";
import { getProducts } from "@/lib/products-store";
import { eligibleMachines, type ConfigInput } from "@/lib/recommender";
import { attachPrices } from "@/lib/server-pricing";

// Step 4 (personal preferences): the machines a visitor may pick or avoid —
// exactly the pool that survives the previous steps' filters. Public; returns
// codes and names only, never prices.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { input?: ConfigInput };
    if (!body.input || !Array.isArray(body.input.includedLines)) {
      return NextResponse.json({ error: "Missing configuration input." }, { status: 400 });
    }
    const pool = (await filterEnabled(await getProducts())).filter((p) => !p.custom);
    const machines = eligibleMachines(await attachPrices(pool), { ...body.input, mustAvoid: [], mustInclude: [] })
      .map((p) => ({ code: p.code, name: p.nameEn }))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    return NextResponse.json({ machines });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load machines." }, { status: 400 });
  }
}
