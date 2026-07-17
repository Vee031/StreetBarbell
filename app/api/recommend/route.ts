import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products-store";
import { recommend, type ConfigInput, type PriorityKey } from "@/lib/recommender";
import { isDistributorAuthenticated } from "@/lib/server-auth";
import { attachPrices } from "@/lib/server-pricing";

const priorityKeys: PriorityKey[] = ["balance", "specialization", "variety", "beginner", "accessibility", "throughput", "space", "complement", "value"];

function validateInput(input: ConfigInput | undefined) {
  if (!input) return "Missing configuration input.";
  if (!Number.isFinite(input.budgetCzk) || input.budgetCzk < 50_000 || input.budgetCzk > 100_000_000) return "Budget is outside the supported range.";
  if (!Number.isFinite(input.exchangeRate) || input.exchangeRate < 1 || input.exchangeRate > 100) return "Invalid exchange rate.";
  if (!Number.isFinite(input.reservePercent) || input.reservePercent < 0 || input.reservePercent > 80) return "Invalid reserve percentage.";
  if (input.machineCount !== "auto" && (!Number.isInteger(input.machineCount) || input.machineCount < 1 || input.machineCount > 6)) return "Invalid machine count.";
  if (!Number.isInteger(input.resultCount) || input.resultCount < 1 || input.resultCount > 10) return "Invalid result count.";
  if (!input.priorities || priorityKeys.some((key) => !Number.isFinite(input.priorities[key]) || input.priorities[key] < 0 || input.priorities[key] > 10)) return "Invalid priority matrix.";
  const totalPoints = priorityKeys.reduce((sum, key) => sum + input.priorities[key], 0);
  if (totalPoints !== 20) return "Priority points must total exactly 20.";
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
    const result = recommend(await attachPrices(await getProducts()), body.input, body.locale === "cs" ? "cs" : "en");
    return NextResponse.json({ results: result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Recommendation failed." }, { status: 400 });
  }
}
