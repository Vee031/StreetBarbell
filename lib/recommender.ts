import type { Product } from "@/lib/data";
import type { PricedProduct } from "@/lib/server-pricing";

export type PrimaryFocus = "full" | "upper" | "lower";
export type PositionPreference = "seated" | "standing" | "any";

// Three bipolar sliders, 1..5, 3 = neutral. See docs/GENERATOR_SPEC.md.
export type ConfigInput = {
  budgetCzk: number;
  exchangeRate: number;
  machineCount: "auto" | number; // fixed number => budget ignored
  availableSpace: number; // m², soft preference (~6 m²/machine)
  includedLines: string[]; // line slugs the search may use (from the category chips)
  existingWorkout: boolean; // true => exclude Workout line + deprioritize duplicate machines
  primaryFocus: PrimaryFocus;
  position: PositionPreference;
  wheelchair: boolean;
  balanceSpecialised: number; // 1 balanced .. 5 specialised
  publicPrivate: number; // 1 public .. 5 private
  costUse: number; // 1 as cheap as possible .. 5 no limit
  resultCount: number;
};

export type MetricKey = "coverage" | "focusFit" | "value" | "space";

export type CombinationResult = {
  id: string;
  products: Product[];
  totalEur: number;
  totalCzk: number;
  footprint: number | null;
  score: number;
  metrics: Record<MetricKey, number>;
  strengths: string[];
  weakness: string;
  purpose: string;
};

const SPACE_PER_MACHINE = 6; // m²
const DUMBBELL_CODES = new Set(["MB 7.33", "MB 7.34", "MB 7.71", "MB 7.72"]);
const CONV_DIV_CODES = new Set(["MB 7.52", "MB 7.53", "MB 7.54", "MB 7.55", "MB 7.100"]);
// Machines that duplicate a pull-up / calisthenics rig (lower priority when one already exists).
const DEPRIORITIZE_CODES = new Set(["MB 7.38", "MB 7.55", "MB 7.47", "MB 7.47/1", "MB 7.61", "MB 7.73", "MB 7.62", "MB 7.67", "MB 7.96"]);

const clamp = (value: number, min = 0, max = 10) => Math.max(min, Math.min(max, value));
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

function focusCoverage(product: Product, focus: PrimaryFocus) {
  const c = product.coverage;
  if (focus === "upper") return c.upper;
  if (focus === "lower") return c.lower;
  return average([c.upper, c.lower, c.core]);
}

// Even spread across upper/lower/core = full-body machine.
function balanceScore(product: Product) {
  const c = product.coverage;
  const parts = [c.upper, c.lower, c.core];
  const mean = average(parts);
  const spread = average(parts.map((v) => Math.abs(v - mean)));
  return clamp(mean - spread * 0.6);
}

function positionFit(product: Product, position: PositionPreference) {
  if (position === "any") return 0;
  const p = product.position || "";
  if (position === "seated") return /seat/i.test(p) ? 1.2 : /lying|bench/i.test(p) ? 0.4 : -1.4;
  return /stand/i.test(p) ? 1.2 : -1.2; // standing
}

// -1 (cheap) .. +1 (no limit)
const costAxis = (input: ConfigInput) => (input.costUse - 3) / 2;
// -1 (balanced) .. +1 (specialised)
const specAxis = (input: ConfigInput) => (input.balanceSpecialised - 3) / 2;
// -1 (public) .. +1 (private)
const privacyAxis = (input: ConfigInput) => (input.publicPrivate - 3) / 2;

function productScore(product: PricedProduct, input: ConfigInput) {
  if (product.bodyFocus === "Accessory") return -Infinity;
  const spec = specAxis(input);
  const cost = costAxis(input);

  // Body targeting: balanced rewards full-body machines, specialised rewards focus-region machines.
  const focusFit = focusCoverage(product, input.primaryFocus);
  const balance = balanceScore(product);
  let score = 3 + (spec >= 0 ? focusFit * (1 + spec) + balance * (1 - spec) : balance * (1 - spec) + focusFit * (1 + spec));

  score += product.scores.variety * 0.28 + product.scores.beginner * 0.12;
  score += positionFit(product, input.position);

  // Cost axis: cheap prefers Light + affordability; no-limit prefers Standard/Pro/Plus + conv/div.
  if (cost < 0) {
    if (product.line === "Light Line") score += 1.1 * -cost;
    if (product.line === "PRO Line" || product.line === "Plus Line") score -= 0.9 * -cost;
    if (CONV_DIV_CODES.has(product.code)) score -= 1.0 * -cost;
    score += product.scores.affordability * 0.25 * -cost;
  } else if (cost > 0) {
    if (CONV_DIV_CODES.has(product.code)) score += 1.2 * cost;
    if (product.line === "Standard Line" || product.line === "PRO Line" || product.line === "Plus Line") score += 0.6 * cost;
  }

  // Public installations favour robust, low-maintenance machines.
  const privacy = privacyAxis(input);
  if (privacy < 0) score += product.scores.accessibility * 0.15 * -privacy;

  if (input.existingWorkout && DEPRIORITIZE_CODES.has(product.code)) score -= 2.2;

  return score;
}

function passesFilters(product: PricedProduct, input: ConfigInput) {
  if (product.bodyFocus === "Accessory") return false;
  if (!input.includedLines.includes(product.lineSlug)) return false;
  if (!product.priceCzk) return false;
  if (input.existingWorkout && product.lineSlug === "workout-line") return false;
  if (input.wheelchair && product.lineSlug !== "plus-line") return false;

  const cost = costAxis(input);
  if (cost < 0) {
    // "As cheap as possible" (1–2): avoid Pro/Plus and converging/diverging machines.
    if (input.costUse <= 2 && (product.line === "PRO Line" || product.line === "Plus Line")) return false;
    if (input.costUse <= 2 && CONV_DIV_CODES.has(product.code)) return false;
  }

  const privacy = privacyAxis(input);
  if (privacy < 0 && input.publicPrivate <= 2) {
    // Public: avoid loose barbells (dumbbell sets) and the box series (Boxing line).
    if (DUMBBELL_CODES.has(product.code)) return false;
    if (product.lineSlug === "boxing-line") return false;
  }

  return true;
}

function metricsFor(combo: PricedProduct[], input: ConfigInput, totalPrice: number, budget: number): Record<MetricKey, number> {
  const upper = combo.reduce((s, p) => s + p.coverage.upper, 0);
  const lower = combo.reduce((s, p) => s + p.coverage.lower, 0);
  const core = combo.reduce((s, p) => s + p.coverage.core, 0);
  const cardio = combo.reduce((s, p) => s + p.coverage.cardio, 0);
  const coverage = clamp((Math.min(upper, lower, core) / Math.max(1, combo.length)) * 3 + Math.min(2, cardio * 0.4));
  const focusFit = clamp(average(combo.map((p) => focusCoverage(p, input.primaryFocus))) + (specAxis(input) > 0 ? 1 : 0));
  const value = clamp((1 - totalPrice / Math.max(budget, totalPrice)) * 6 + average(combo.map((p) => p.scores.affordability)) * 0.4);
  const knownFootprints = combo.map((p) => p.footprint).filter((v): v is number => typeof v === "number");
  const footprint = knownFootprints.reduce((a, b) => a + b, 0);
  const space = knownFootprints.length ? clamp(10 - Math.max(0, footprint - input.availableSpace) * 0.4) : 5;
  return { coverage, focusFit, value, space };
}

function spacePenalty(comboLength: number, input: ConfigInput) {
  if (!input.availableSpace || input.availableSpace <= 0) return 0;
  const capacity = Math.floor(input.availableSpace / SPACE_PER_MACHINE);
  return comboLength > capacity ? (comboLength - capacity) * 0.9 : 0;
}

function scoreCombination(combo: PricedProduct[], input: ConfigInput, totalPrice: number, budget: number) {
  const metrics = metricsFor(combo, input, totalPrice, budget);
  const base = average(combo.map((p) => productScore(p, input)));

  // Reward complementary movement coverage; penalise duplicated movement patterns.
  const patterns = new Set<string>();
  let duplicates = 0;
  for (const p of combo) {
    for (const raw of p.movementPatterns.split(";").map((v) => v.trim()).filter(Boolean)) {
      if (patterns.has(raw)) duplicates += 1;
      else patterns.add(raw);
    }
  }
  const spec = specAxis(input);
  let score = base + patterns.size * 0.14 - duplicates * Math.max(0, 0.5 - spec * 0.5) * 0.6;
  score += metrics.coverage * (0.25 - spec * 0.15);
  score -= spacePenalty(combo.length, input);
  if (budget > 0) score += Math.min(0.4, (totalPrice / Math.max(1, budget)) * 0.4);

  return { score: Number(clamp(score * 0.9).toFixed(3)), metrics };
}

function enumerateCombos(candidates: PricedProduct[], count: number, budgetCap: number | null, limit = 12000) {
  const combos: { products: PricedProduct[]; price: number }[] = [];
  const walk = (start: number, selected: PricedProduct[], price: number) => {
    if (combos.length >= limit) return;
    if (selected.length === count) {
      combos.push({ products: [...selected], price });
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      const p = candidates[i];
      const productPrice = p.priceCzk ?? 0;
      if (budgetCap !== null && price + productPrice > budgetCap) continue;
      selected.push(p);
      walk(i + 1, selected, price + productPrice);
      selected.pop();
      if (combos.length >= limit) return;
    }
  };
  walk(0, [], 0);
  return combos;
}

function jaccard(a: Product[], b: Product[]) {
  const setA = new Set(a.map((p) => p.code));
  const setB = new Set(b.map((p) => p.code));
  const intersection = [...setA].filter((v) => setB.has(v)).length;
  return intersection / (setA.size + setB.size - intersection);
}

function explanations(metrics: Record<MetricKey, number>, input: ConfigInput, locale: "en" | "cs") {
  const labelsEn: Record<MetricKey, string> = {
    coverage: "balanced body coverage",
    focusFit: input.primaryFocus === "upper" ? "upper-body focus" : input.primaryFocus === "lower" ? "lower-body focus" : "all-round training",
    value: "value for money",
    space: "efficient use of space",
  };
  const labelsCs: Record<MetricKey, string> = {
    coverage: "vyvážené zapojení těla",
    focusFit: input.primaryFocus === "upper" ? "zaměření na horní část" : input.primaryFocus === "lower" ? "zaměření na dolní část" : "všestranný trénink",
    value: "poměr ceny a užitku",
    space: "efektivní využití prostoru",
  };
  const labels = locale === "cs" ? labelsCs : labelsEn;
  const sorted = (Object.entries(metrics) as [MetricKey, number][]).sort((a, b) => b[1] - a[1]);
  const strong = sorted.slice(0, 2).map(([k]) => labels[k]);
  const weak = sorted.at(-1)?.[0] ?? "coverage";
  const focusName = input.primaryFocus === "upper" ? (locale === "cs" ? "horní část těla" : "upper body") : input.primaryFocus === "lower" ? (locale === "cs" ? "dolní část těla" : "lower body") : (locale === "cs" ? "celé tělo" : "full body");
  if (locale === "cs") {
    return {
      purpose: `Sestava pro ${focusName}, která vyniká v ${strong.join(" a ")}.`,
      strengths: strong.map((v) => `Silná stránka: ${v}.`),
      weakness: `Hlavní kompromis: nižší hodnocení pro ${labels[weak]}.`,
    };
  }
  return {
    purpose: `A ${focusName} setup that stands out for ${strong.join(" and ")}.`,
    strengths: strong.map((v) => `Strong ${v}.`),
    weakness: `Main trade-off: lower score for ${labels[weak]}.`,
  };
}

export function recommend(products: PricedProduct[], input: ConfigInput, locale: "en" | "cs"): CombinationResult[] {
  const fixedCount = input.machineCount !== "auto";
  const budget = fixedCount ? 0 : input.budgetCzk;
  const budgetCap = fixedCount ? null : input.budgetCzk;

  let candidates = products
    .filter((product) => passesFilters(product, input))
    .filter((product) => (budgetCap === null ? true : (product.priceCzk ?? Infinity) <= budgetCap))
    .sort((a, b) => productScore(b, input) - productScore(a, input));

  if (candidates.length === 0) return [];

  const poolSize = fixedCount ? 18 : 24;
  candidates = candidates.slice(0, poolSize);

  let counts: number[];
  if (fixedCount) {
    counts = [Math.min(Number(input.machineCount), candidates.length)];
  } else {
    const prices = candidates.map((p) => p.priceCzk ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
    const reference = prices.length ? prices[Math.floor((prices.length - 1) * 0.78)] : input.budgetCzk;
    const inferred = Math.max(1, Math.min(5, Math.floor(input.budgetCzk / Math.max(1, reference))));
    counts = [inferred];
  }

  const scored: CombinationResult[] = [];
  for (const count of counts) {
    for (const { products: combo, price } of enumerateCombos(candidates, count, budgetCap)) {
      const { score, metrics } = scoreCombination(combo, input, price, budget || input.budgetCzk);
      const footprints = combo.map((p) => p.footprint).filter((v): v is number => typeof v === "number");
      scored.push({
        id: combo.map((p) => p.code).join("+"),
        products: combo,
        totalEur: price / Math.max(1, input.exchangeRate),
        totalCzk: price,
        footprint: footprints.length === combo.length ? footprints.reduce((a, b) => a + b, 0) : null,
        score,
        metrics,
        ...explanations(metrics, input, locale),
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const diverse: CombinationResult[] = [];
  for (const candidate of scored) {
    const limit = candidate.products.length <= 2 ? 0.3 : 0.5;
    if (diverse.every((selected) => jaccard(selected.products, candidate.products) < limit)) diverse.push(candidate);
    if (diverse.length >= input.resultCount) break;
  }
  if (diverse.length < input.resultCount) {
    for (const candidate of scored) {
      if (!diverse.some((v) => v.id === candidate.id)) diverse.push(candidate);
      if (diverse.length >= input.resultCount) break;
    }
  }
  return diverse;
}
