import { NextResponse } from "next/server";
import { filterEnabled } from "@/lib/product-meta";
import { getProducts } from "@/lib/products-store";
import { recommend, type ConfigInput } from "@/lib/recommender";
import { isDistributorAuthenticated } from "@/lib/server-auth";
import { attachPrices } from "@/lib/server-pricing";

const LINE_SLUGS = new Set(["standard-line", "light-line", "plus-line", "pro-line", "cardio-line", "workout-line", "gymnastics-line", "boxing-line", "kids-line"]);
const slider = (v: unknown) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5;

function validateInput(input: ConfigInput | undefined) {
  if (!input) return "Missing configuration input.";
  if (!Number.isFinite(input.budgetCzk) || input.budgetCzk < 10_000 || input.budgetCzk > 100_000_000) return "Budget is outside the supported range.";
  if (!Number.isFinite(input.exchangeRate) || input.exchangeRate < 1 || input.exchangeRate > 100) return "Invalid exchange rate.";
  if (!Number.isFinite(input.availableSpace) || input.availableSpace < 0 || input.availableSpace > 100_000) return "Invalid available space.";
  if (input.machineCount !== "auto" && (!Number.isInteger(input.machineCount) || input.machineCount < 1 || input.machineCount > 8)) return "Invalid machine count.";
  if (!Number.isInteger(input.resultCount) || input.resultCount < 1 || input.resultCount > 10) return "Invalid result count.";
  if (!Array.isArray(input.includedLines) || input.includedLines.some((s) => !LINE_SLUGS.has(s))) return "Invalid line selection.";
  if (!["full", "upper", "lower"].includes(input.primaryFocus)) return "Invalid primary focus.";
  if (!["seated", "standing", "any"].includes(input.position)) return "Invalid position preference.";
  if (![input.balanceSpecialised, input.publicPrivate, input.costUse].every(slider)) return "Invalid priority sliders.";
  if (typeof input.existingWorkout !== "boolean" || typeof input.wheelchair !== "boolean") return "Invalid toggles.";
  return null;
}

export async function POST(request: Request) {
  if (!(await isDistributorAuthenticated())) {
    return NextResponse.json({ error: "Distributor access required." }, { status: 401 });
  }
  try {
    const body = (await request.json()) as { input?: ConfigInput; locale?: "en" | "cs" };
    const validationError = validateInput(body.input);
    if (validationError || !body.input) return NextResponse.json({ error: validationError }, { status: 400 });
    const result = recommend(await attachPrices(await filterEnabled(await getProducts())), body.input, body.locale === "cs" ? "cs" : "en");
    return NextResponse.json({ results: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Recommendation failed." }, { status: 400 });
  }
}
