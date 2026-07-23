import type { Product } from "@/lib/data";
import type { PricedProduct } from "@/lib/server-pricing";
import {
  CONVERGING_DIVERGING_CODES,
  COST_CHEAP_MAX,
  DEPRIORITIZE_WHEN_WORKOUT_CODES,
  EXCLUDE_WHEN_NO_BODYWEIGHT_CODES,
  EXISTING_WORKOUT_EXCLUDE_LINES,
  LINES,
  MAX_OTHER_SHARE,
  PREFERRED_CORE_LINES,
  PREFER_PREMIUM_FROM_NEUTRAL,
  PUBLIC_AVOID_CODES,
  PUBLIC_AVOID_LINES,
  PUBLIC_MAX,
  SPACE_PER_MACHINE_M2,
  WEIGHTLIFTING_PREMIUM_LINES,
  effectiveLineSlug,
  exerciseFamily,
} from "@/lib/generator-rules";

export type PrimaryFocus = "full" | "upper" | "lower";
export type PositionPreference = "seated" | "standing" | "any";

// Three bipolar sliders, 1..5, 3 = neutral. See docs/GENERATOR_SPEC.md.
export type ConfigInput = {
  budgetCzk: number;
  exchangeRate: number;
  machineCount: "auto" | number; // fixed number => budget ignored
  availableSpace: number; // m², soft preference (~6 m²/machine)
  includedLines: string[]; // line slugs the search may use (from the category chips)
  bodyweight: boolean; // false => also drop the "no bodyweight" excluded machines
  existingWorkout: boolean; // true => exclude Workout line + deprioritize duplicate machines
  primaryFocus: PrimaryFocus; // derived from the body-coverage slider (≤2 lower, ≥4 upper, else full)
  position: PositionPreference;
  wheelchair: boolean;
  balanceSpecialised: number; // 1 lower body .. 3 no preference .. 5 upper body
  publicPrivate: number; // 1 public .. 5 private
  costUse: number; // 1 as cheap as possible .. 5 no limit
  resultCount: number;
  mustInclude?: string[]; // step 4: machines the user explicitly wants in every setup
  mustAvoid?: string[]; // step 4: machines the user never wants proposed
};

// The three result bars mirror the three priority sliders 1:1 — each metric is
// "how well this setup matches the slider as you set it" (0–10).
export type MetricKey = "bodyCoverage" | "installation" | "costUse";

export type CombinationResult = {
  id: string;
  products: Product[];
  totalEur: number;
  totalCzk: number;
  footprint: number | null;
  score: number; // internal ranking value
  match: number; // 0–100 % — average of the three slider-match metrics, shown to the user
  metrics: Record<MetricKey, number>;
  strengths: string[];
  weakness: string;
  purpose: string;
};

// Rule data lives in lib/generator-rules.ts (the single "rules map"); wrapped in
// Sets here for O(1) lookups during scoring.
const DUMBBELL_CODES = new Set(PUBLIC_AVOID_CODES);
const CONV_DIV_CODES = new Set(CONVERGING_DIVERGING_CODES);
const DEPRIORITIZE_CODES = new Set(DEPRIORITIZE_WHEN_WORKOUT_CODES);
const NO_BODYWEIGHT_EXCLUDE = new Set(EXCLUDE_WHEN_NO_BODYWEIGHT_CODES);
const PUBLIC_AVOID_LINE_SET = new Set(PUBLIC_AVOID_LINES);
const EXISTING_WORKOUT_EXCLUDE_SET = new Set(EXISTING_WORKOUT_EXCLUDE_LINES);
const PREMIUM_LINE_SET = new Set(WEIGHTLIFTING_PREMIUM_LINES);
const CORE_LINE_SET = new Set(PREFERRED_CORE_LINES);

const lineOf = (p: PricedProduct) => effectiveLineSlug(p.code, p.lineSlug);
const familyOf = (p: PricedProduct) => exerciseFamily(p.code, p.nameEn, lineOf(p));

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
// Body-coverage slider: the DIRECTION (lower/upper) is carried by primaryFocus;
// this returns the focus INTENSITY 0 (middle, no preference) .. 1 (either end).
const specAxis = (input: ConfigInput) => Math.abs(input.balanceSpecialised - 3) / 2;
// -1 (public) .. +1 (private)
const privacyAxis = (input: ConfigInput) => (input.publicPrivate - 3) / 2;

function productScore(product: PricedProduct, input: ConfigInput) {
  if (product.bodyFocus === "Accessory") return -Infinity;
  const spec = specAxis(input);
  const cost = costAxis(input);

  // Body targeting: middle of the slider rewards full-body machines, either end
  // rewards machines covering the chosen region (lower/upper via primaryFocus).
  const focusFit = focusCoverage(product, input.primaryFocus);
  const balance = balanceScore(product);
  let score = 3 + focusFit * (1 + spec) + balance * (1 - spec);

  score += product.scores.variety * 0.28 + product.scores.beginner * 0.12;
  score += positionFit(product, input.position);

  // Cost axis: cheap prefers Light + affordability; no-limit prefers Standard/Pro/Plus.
  const line = lineOf(product);
  const isConvDiv = CONV_DIV_CODES.has(product.code);
  if (cost < 0) {
    if (line === "light-line") score += 1.1 * -cost;
    if (PREMIUM_LINE_SET.has(line)) score -= 0.9 * -cost;
    if (isConvDiv) score -= 1.0 * -cost; // cheap band: avoid converging/diverging
    score += product.scores.affordability * 0.25 * -cost;
  } else {
    // Neutral and up: the converging/diverging variant is the "best" version, so it is
    // preferred as its family's pick (owner 2026-07-21) — stronger toward "no limit".
    if (isConvDiv && PREFER_PREMIUM_FROM_NEUTRAL) score += 0.9 + 1.0 * cost;
    if (cost > 0 && (line === "standard-line" || PREMIUM_LINE_SET.has(line))) score += 0.6 * cost;
  }
  // #6 — nudge Standard/Light up so setups lean on the core lines.
  if (CORE_LINE_SET.has(line)) score += 0.4;

  // Public installations favour robust, low-maintenance machines.
  const privacy = privacyAxis(input);
  if (privacy < 0) score += product.scores.accessibility * 0.15 * -privacy;

  if (input.existingWorkout && DEPRIORITIZE_CODES.has(product.code)) score -= 2.2;

  return score;
}

function passesFilters(product: PricedProduct, input: ConfigInput) {
  if (product.bodyFocus === "Accessory") return false;
  if (input.mustAvoid?.includes(product.code)) return false; // step 4: explicitly avoided
  const line = lineOf(product);
  if (!input.includedLines.includes(line)) return false;
  if (!product.priceCzk) return false;
  if (input.existingWorkout && EXISTING_WORKOUT_EXCLUDE_SET.has(line)) return false;
  if (!input.bodyweight && NO_BODYWEIGHT_EXCLUDE.has(product.code)) return false;
  if (input.wheelchair && line !== "plus-line") return false;

  const cost = costAxis(input);
  if (cost < 0) {
    // "As cheap as possible" band: avoid Pro/Plus and converging/diverging machines.
    if (input.costUse <= COST_CHEAP_MAX && PREMIUM_LINE_SET.has(line)) return false;
    if (input.costUse <= COST_CHEAP_MAX && CONV_DIV_CODES.has(product.code)) return false;
  }

  const privacy = privacyAxis(input);
  if (privacy < 0 && input.publicPrivate <= PUBLIC_MAX) {
    // Public: avoid loose barbells (dumbbell sets) and the box series (Boxing line).
    if (DUMBBELL_CODES.has(product.code)) return false;
    if (PUBLIC_AVOID_LINE_SET.has(line)) return false;
  }

  return true;
}

// #6 — cap how much of a setup can come from lines other than Standard/Light.
function coreLinePenalty(combo: PricedProduct[], input: ConfigInput) {
  const coreInSearch = PREFERRED_CORE_LINES.some((l) => input.includedLines.includes(l));
  if (!coreInSearch || combo.length < 2) return 0;
  const others = combo.filter((p) => !CORE_LINE_SET.has(lineOf(p))).length;
  const maxOthers = Math.floor(combo.length * MAX_OTHER_SHARE);
  return others > maxOthers ? (others - maxOthers) * 4 : 0;
}

// Each metric answers: "how well does this combination match the slider AS SET?"
// The two poles of a slider are scored separately, then blended by the slider
// position (1 → pure left pole, 5 → pure right pole, 3 → the average of both).
function metricsFor(combo: PricedProduct[], input: ConfigInput, totalPrice: number, budget: number): Record<MetricKey, number> {
  const blend = (left: number, right: number, axis: number) => {
    const t = (axis + 1) / 2; // -1..1 → 0..1
    return clamp(left * (1 - t) + right * t);
  };

  // Body coverage: balanced pole = even upper/lower/core spread, specialised pole
  // = concentration on the chosen focus region.
  const upper = combo.reduce((s, p) => s + p.coverage.upper, 0);
  const lower = combo.reduce((s, p) => s + p.coverage.lower, 0);
  const core = combo.reduce((s, p) => s + p.coverage.core, 0);
  const cardio = combo.reduce((s, p) => s + p.coverage.cardio, 0);
  const balancedPole = clamp((Math.min(upper, lower, core) / Math.max(1, combo.length)) * 3 + Math.min(2, cardio * 0.4));
  const specialisedPole = clamp(average(combo.map((p) => focusCoverage(p, input.primaryFocus))) * 1.2);
  // specAxis is already an intensity 0..1 (middle → balanced pole, ends → focus pole).
  const focusIntensity = specAxis(input);
  const bodyCoverage = clamp(balancedPole * (1 - focusIntensity) + specialisedPole * focusIntensity);

  // Installation: public pole = robust, high-throughput, beginner-friendly machines
  // (loose dumbbells/boxing are already filtered out at the public end); private
  // pole = freedom to use specialised equipment.
  const publicPole = clamp(average(combo.map((p) => p.scores.beginner * 0.55 + p.scores.throughput * 0.45)) + 1);
  const specialCount = combo.filter((p) => CONV_DIV_CODES.has(p.code) || DUMBBELL_CODES.has(p.code) || PREMIUM_LINE_SET.has(lineOf(p))).length;
  const privatePole = clamp(5.5 + average(combo.map((p) => p.scores.variety)) * 0.25 + specialCount * 1.2);
  const installation = blend(publicPole, privatePole, privacyAxis(input));

  // Cost & use: cheap pole = affordability + budget headroom, no-limit pole =
  // premium machines (Pro/Plus, converging/diverging).
  const cheapPole = clamp(average(combo.map((p) => p.scores.affordability)) * 0.75 + (budget > 0 ? (1 - totalPrice / Math.max(budget, totalPrice)) * 5 : 2.5) + 2);
  const premiumCount = combo.filter((p) => CONV_DIV_CODES.has(p.code) || PREMIUM_LINE_SET.has(lineOf(p))).length;
  const premiumPole = clamp(4 + (premiumCount / Math.max(1, combo.length)) * 7);
  const costUse = blend(cheapPole, premiumPole, costAxis(input));

  return { bodyCoverage, installation, costUse };
}

function spacePenalty(comboLength: number, input: ConfigInput) {
  if (!input.availableSpace || input.availableSpace <= 0) return 0;
  const capacity = Math.floor(input.availableSpace / SPACE_PER_MACHINE_M2);
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
  score += metrics.bodyCoverage * (0.25 - spec * 0.15);
  score -= spacePenalty(combo.length, input);
  score -= coreLinePenalty(combo, input);
  if (budget > 0) score += Math.min(0.4, (totalPrice / Math.max(1, budget)) * 0.4);

  return { score: Number(clamp(score * 0.9).toFixed(3)), metrics };
}

function enumerateCombos(candidates: PricedProduct[], count: number, budgetCap: number | null, limit = 12000) {
  const combos: { products: PricedProduct[]; price: number }[] = [];
  const usedFamilies = new Set<string>();
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
      const family = familyOf(p);
      if (usedFamilies.has(family)) continue; // #2 — no two machines from the same exercise family
      usedFamilies.add(family);
      selected.push(p);
      walk(i + 1, selected, price + productPrice);
      selected.pop();
      usedFamilies.delete(family);
      if (combos.length >= limit) return;
    }
  };
  walk(0, [], 0);
  return combos;
}

function jaccard(a: Product[], b: Product[]) {
  const setA = new Set(a.map((p) => p.code));
  const setB = new Set(b.map((p) => p.code));
  if (setA.size === 0 && setB.size === 0) return 1; // identical (both empty)
  const intersection = [...setA].filter((v) => setB.has(v)).length;
  return intersection / (setA.size + setB.size - intersection);
}

// The machines a visitor can pick from in step 4 (personal preferences): the
// pool that survives the line chips and every filter of the previous steps.
export function eligibleMachines(products: PricedProduct[], input: ConfigInput) {
  return products.filter((product) => passesFilters(product, input));
}

// Fact-based texts: every sentence is derived from the actual machines in the
// setup and the sliders as set — no generic filler. Wording is assembled from
// verified facts (line composition, region coverage, premium machines, budget
// fit, space fit), so two different results read differently.
function explanations(combo: PricedProduct[], input: ConfigInput, totalPrice: number, budget: number, footprint: number | null, locale: "en" | "cs") {
  const cs = locale === "cs";
  const lineLabel = (slug: string) => {
    const line = LINES.find((l) => l.slug === slug);
    return line ? (cs ? line.cs : line.en) : slug;
  };

  // Facts about the combination.
  const lineCounts = new Map<string, number>();
  for (const p of combo) lineCounts.set(lineOf(p), (lineCounts.get(lineOf(p)) ?? 0) + 1);
  const lineList = [...lineCounts.entries()].sort((a, b) => b[1] - a[1]).map(([slug, n]) => (n > 1 ? `${n}× ${lineLabel(slug)}` : lineLabel(slug))).join(", ");
  const upper = combo.reduce((s, p) => s + p.coverage.upper, 0) / combo.length;
  const lower = combo.reduce((s, p) => s + p.coverage.lower, 0) / combo.length;
  const core = combo.reduce((s, p) => s + p.coverage.core, 0) / combo.length;
  const convDiv = combo.filter((p) => CONV_DIV_CODES.has(p.code));
  const premium = combo.filter((p) => PREMIUM_LINE_SET.has(lineOf(p)));
  const lightCount = combo.filter((p) => lineOf(p) === "light-line").length;
  const complementAvg = average(combo.map((p) => p.scores.complement));
  const patterns = new Set(combo.flatMap((p) => p.movementPatterns.split(";").map((v) => v.trim()).filter(Boolean)));
  const focusName = input.primaryFocus === "upper" ? (cs ? "horní část těla" : "the upper body") : input.primaryFocus === "lower" ? (cs ? "dolní část těla" : "the lower body") : (cs ? "celé tělo" : "the whole body");
  const machinesNoun = cs ? (combo.length === 1 ? "stroj" : combo.length <= 4 ? "stroje" : "strojů") : combo.length === 1 ? "machine" : "machines";

  const purpose = cs
    ? `${combo.length} ${machinesNoun} pro ${focusName} — složení: ${lineList}.`
    : `${combo.length} ${machinesNoun} for ${focusName} — built from: ${lineList}.`;

  // Strengths: only claims that are true for THIS setup, ordered by relevance
  // to the sliders as set. Take the first three.
  const strengths: string[] = [];
  const pickedHere = (input.mustInclude ?? []).filter((code) => combo.some((p) => p.code === code));
  if (pickedHere.length > 0) {
    strengths.push(cs ? `Obsahuje stroje z vašeho výběru (${pickedHere.join(", ")}).` : `Includes the machines you picked (${pickedHere.join(", ")}).`);
  }
  if (input.publicPrivate <= 2) {
    strengths.push(cs ? "Vhodné pro veřejný prostor — bez volných jednoruček a boxovacího vybavení." : "Suitable for public installation — no loose dumbbell sets or boxing equipment.");
  } else if (input.publicPrivate >= 4 && (convDiv.length > 0 || premium.length > 0)) {
    strengths.push(cs ? "Využívá volnost soukromé instalace včetně specializovanějších strojů." : "Takes advantage of a private setting, including more specialised machines.");
  }
  if (input.costUse <= 2 && lightCount > 0) {
    strengths.push(cs ? `Drží cenu nízko: ${lightCount} z ${combo.length} strojů z úsporné řady Light.` : `Keeps the price down: ${lightCount} of ${combo.length} machines from the economical Light line.`);
  } else if (input.costUse >= 4 && convDiv.length > 0) {
    strengths.push(cs ? `Obsahuje prémiové converging/diverging stroje (${convDiv.map((p) => p.code).join(", ")}).` : `Includes premium converging/diverging machines (${convDiv.map((p) => p.code).join(", ")}).`);
  }
  if (input.balanceSpecialised === 3 && Math.min(upper, lower, core) >= 2.2) {
    strengths.push(cs ? "Rovnoměrně zapojuje horní i dolní polovinu těla a střed těla." : "Works the upper body, lower body and core evenly.");
  } else if (input.balanceSpecialised !== 3 && input.primaryFocus !== "full") {
    strengths.push(cs ? `Cíleně staví na strojích pro ${focusName}.` : `Deliberately built around machines for ${focusName}.`);
  }
  if (input.existingWorkout && complementAvg >= 5.5) {
    strengths.push(cs ? "Dobře doplňuje stávající workoutovou konstrukci — bez duplicit s hrazdami." : "Complements your existing workout structure — no overlap with pull-up rigs.");
  }
  if (budget > 0 && totalPrice <= budget) {
    strengths.push(cs ? "Vejde se do zadaného rozpočtu." : "Fits within your budget.");
  }
  if (strengths.length < 2) {
    strengths.push(cs ? `${patterns.size} různých pohybových vzorců bez zdvojených strojů.` : `${patterns.size} distinct movement patterns with no duplicated machines.`);
  }

  // One honest trade-off, first true statement wins.
  let weakness: string;
  if (footprint !== null && input.availableSpace > 0 && footprint > input.availableSpace) {
    weakness = cs ? `Plocha strojů (~${footprint.toFixed(0)} m²) přesahuje zadaný prostor.` : `The machine footprint (~${footprint.toFixed(0)} m²) exceeds your available space.`;
  } else if (footprint !== null && input.availableSpace > 0 && footprint > input.availableSpace * 0.8) {
    weakness = cs ? "Plocha strojů se blíží hranici dostupného prostoru." : "The machine footprint is close to your available space.";
  } else if (Math.min(upper, lower, core) < 1.2 && input.balanceSpecialised === 3) {
    const gap = upper <= lower && upper <= core ? (cs ? "horní části těla" : "the upper body") : lower <= core ? (cs ? "dolní části těla" : "the lower body") : (cs ? "středu těla" : "the core");
    weakness = cs ? `Slabší pokrytí ${gap} — zvažte doplnění dalším strojem.` : `Lighter coverage of ${gap} — consider adding one more machine.`;
  } else if (input.costUse >= 4 && premium.length + convDiv.length > 0) {
    weakness = cs ? "Prémiové stroje zvyšují celkovou cenu sestavy." : "Premium machines raise the total price of the setup.";
  } else if (input.costUse <= 2) {
    weakness = cs ? "Úsporná volba — bez prémiových converging/diverging strojů." : "Economical choice — no premium converging/diverging machines.";
  } else if (combo.length <= 2) {
    weakness = cs ? "Malý počet strojů — pokrytí tréninku je nutně užší." : "A small setup — training coverage is necessarily narrower.";
  } else {
    weakness = cs ? "Bez zásadního kompromisu — vyvážená sestava pro zadané priority." : "No major trade-off — a balanced setup for your priorities.";
  }

  return { purpose, strengths: strengths.slice(0, 3), weakness };
}

export function recommend(products: PricedProduct[], input: ConfigInput, locale: "en" | "cs"): CombinationResult[] {
  const fixedCount = input.machineCount !== "auto";
  const hasBudget = !fixedCount && input.budgetCzk > 0; // budget 0 = left blank
  const budget = hasBudget ? input.budgetCzk : 0;
  const budgetCap = hasBudget ? input.budgetCzk : null;

  // Step 4: machines the user explicitly picked go into EVERY setup; avoided
  // machines are dropped in passesFilters.
  const avoidSet = new Set(input.mustAvoid ?? []);
  const forcedCodes = [...new Set((input.mustInclude ?? []).filter((code) => !avoidSet.has(code)))];
  const forced = forcedCodes
    .map((code) => products.find((p) => p.code === code))
    .filter((p): p is PricedProduct => Boolean(p && p.priceCzk));
  const forcedSet = new Set(forced.map((p) => p.code));
  const forcedFamilies = new Set(forced.map(familyOf));
  const forcedPrice = forced.reduce((sum, p) => sum + (p.priceCzk ?? 0), 0);

  let candidates = products
    .filter((product) => passesFilters(product, input))
    .filter((product) => !forcedSet.has(product.code) && !forcedFamilies.has(familyOf(product)))
    .filter((product) => (budgetCap === null ? true : (product.priceCzk ?? Infinity) <= budgetCap))
    .sort((a, b) => productScore(b, input) - productScore(a, input));

  if (candidates.length === 0 && forced.length === 0) return [];

  const poolSize = fixedCount ? 18 : 24;
  candidates = candidates.slice(0, poolSize);

  let counts: number[];
  if (fixedCount) {
    counts = [Math.min(Number(input.machineCount), candidates.length + forced.length)];
  } else if (hasBudget) {
    const prices = candidates.map((p) => p.priceCzk ?? 0).filter((v) => v > 0).sort((a, b) => a - b);
    const reference = prices.length ? prices[Math.floor((prices.length - 1) * 0.78)] : input.budgetCzk;
    const inferred = Math.max(1, Math.min(5, Math.floor(input.budgetCzk / Math.max(1, reference))));
    counts = [inferred];
  } else {
    counts = [Math.min(3, candidates.length + forced.length)]; // blank budget → a sensible default setup size
  }

  const scored: CombinationResult[] = [];
  for (const count of counts) {
    const extrasCount = Math.max(0, count - forced.length);
    const remainingCap = budgetCap === null ? null : Math.max(0, budgetCap - forcedPrice);
    const enumerated = extrasCount === 0
      ? [{ products: [] as PricedProduct[], price: 0 }]
      : enumerateCombos(candidates, extrasCount, remainingCap);
    for (const { products: extras, price: extrasPrice } of enumerated) {
      const combo = [...forced, ...extras];
      if (combo.length === 0) continue;
      const price = forcedPrice + extrasPrice;
      const { score, metrics } = scoreCombination(combo, input, price, budget || input.budgetCzk);
      const footprints = combo.map((p) => p.footprint).filter((v): v is number => typeof v === "number");
      const footprint = footprints.length === combo.length ? footprints.reduce((a, b) => a + b, 0) : null;
      scored.push({
        id: combo.map((p) => p.code).join("+"),
        products: combo,
        totalEur: price / Math.max(1, input.exchangeRate),
        totalCzk: price,
        footprint,
        score,
        match: Math.round(average(Object.values(metrics)) * 10),
        metrics,
        ...explanations(combo, input, price, budget, footprint, locale),
      });
    }
  }

  // Rank by slider match (what the user sees), internal score breaks ties.
  scored.sort((a, b) => b.match - a.match || b.score - a.score);
  // Diversity is judged on the non-forced part — every setup shares the
  // machines the user explicitly picked in step 4.
  const extrasOf = (r: CombinationResult) => r.products.filter((p) => !forcedSet.has(p.code));
  const diverse: CombinationResult[] = [];
  for (const candidate of scored) {
    const limit = candidate.products.length <= 2 ? 0.3 : 0.5;
    if (diverse.every((selected) => jaccard(extrasOf(selected), extrasOf(candidate)) < limit)) diverse.push(candidate);
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
