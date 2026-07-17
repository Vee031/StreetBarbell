import type { Product } from "@/lib/data";
import type { PricedProduct } from "@/lib/server-pricing";

export type Focus = "Full Body" | "Upper Body" | "Lower Body" | "Core / Posterior Chain" | "Cardio / Conditioning" | "Sport-specific";
export type PositionPreference = "Doesn't matter" | "Standing" | "Seated" | "Lying / Bench" | "Mixed / Multiple" | "Hanging / Bodyweight";
export type SpecializationMode = "Balanced" | "Focused" | "Maximum concentration" | "No preference";

export type PriorityKey =
  | "balance"
  | "specialization"
  | "variety"
  | "beginner"
  | "accessibility"
  | "throughput"
  | "space"
  | "complement"
  | "value";

export type Priorities = Record<PriorityKey, number>;

export type ConfigInput = {
  budgetCzk: number;
  exchangeRate: number;
  reservePercent: number;
  existingWorkout: boolean;
  focus: Focus;
  sport: string;
  position: PositionPreference;
  strictPosition: boolean;
  machineCount: "auto" | number;
  resultCount: number;
  specializationMode: SpecializationMode;
  priorities: Priorities;
};

export type CombinationResult = {
  id: string;
  products: Product[];
  totalEur: number;
  totalCzk: number;
  footprint: number | null;
  score: number;
  metrics: Record<PriorityKey, number>;
  strengths: string[];
  weakness: string;
  purpose: string;
};

const clamp = (value: number, min = 0, max = 10) => Math.max(min, Math.min(max, value));
const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

function capacityNumber(value: string) {
  if (value === "3+") return 3.5;
  if (value === "2+") return 2.5;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 1;
}

function productText(product: Product) {
  return `${product.nameEn} ${product.movementPatterns} ${product.bodyFocus} ${product.secondaryFocus}`.toLowerCase();
}

function soccerSuitability(product: Product) {
  const text = productText(product);
  const name = product.nameEn.toLowerCase();
  const resistanceLine = ["Light Line", "Standard Line", "PRO Line", "Plus Line"].includes(product.line);
  let score = product.coverage.lower * 0.4 + product.coverage.core * 0.08 + product.coverage.cardio * 0.06;

  // Football profile: compound leg strength and hamstring resilience come first.
  // Low-load bodyweight/cardio elements remain valid, but should not outrank them.
  if (/squat|leg press/.test(name) && resistanceLine) score += 2.5;
  else if (/squat|leg press|knee-dominant/.test(text) && !/stepper/.test(name)) score += 1.15;

  if (/leg curl/.test(name) && resistanceLine) score += 2.45;
  else if (/knee flexion/.test(text)) score += 1.3;

  if (/deadlift|combo lift|hip thrust|glute press/.test(name) && resistanceLine) score += 2.25;
  else if (/hyperextension/.test(name)) score += resistanceLine ? 0.95 : 0.65;
  else if (/hip hinge|hip extension/.test(text)) score += 1.0;

  if (/leg extension/.test(name) && resistanceLine) score += 1.55;
  else if (/knee extension/.test(text)) score += 0.9;

  if (/outer thigh|inner thigh|hip abduction|hip adduction|leg spreading/.test(text)) score += 0.75;
  if (/stepper|bike|elliptical|cardiovascular locomotion|cardio rowing/.test(text)) score += 0.55;

  if (resistanceLine) score += 0.7;
  if (product.line === "Gymnastics Line") score -= 0.6;
  if (product.line === "Cardio Line") score -= 0.25;
  return Math.max(0, score);
}

function strengthSuitability(product: Product) {
  const text = productText(product);
  let score = average([product.coverage.upper, product.coverage.lower, product.coverage.core]);
  if (/squat|deadlift|combo lift|bench press|chest press|standing row|seated row|lat pull|shoulder press|vertical press|hip thrust/.test(text)) score += 1.8;
  if (/multi trainer|multi workout|multi-station|dumbbell/.test(text)) score += 1.2;
  if (["Light Line", "Standard Line", "PRO Line", "Plus Line"].includes(product.line)) score += 0.55;
  if (product.line === "Gymnastics Line" || product.line === "Cardio Line") score -= 0.35;
  return Math.max(0, score);
}

function baseFocusMetric(product: Product, focus: Focus) {
  const c = product.coverage;
  if (focus === "Upper Body") return c.upper;
  if (focus === "Lower Body") return c.lower;
  if (focus === "Core / Posterior Chain") return c.core;
  if (focus === "Cardio / Conditioning") return c.cardio;
  return average([c.upper, c.lower, c.core]);
}

function focusMetric(product: Product, focus: Focus, sport: string) {
  const base = baseFocusMetric(product, focus);
  const sportName = sport.toLowerCase();

  // Sport profiles remain active even when the user also selects a body region.
  // This avoids treating "Lower Body + Soccer" like a generic lower-body request.
  if (sportName.includes("soccer")) {
    const sportScore = soccerSuitability(product);
    return focus === "Lower Body" || focus === "Sport-specific"
      ? base * 0.55 + sportScore * 0.45
      : base * 0.8 + sportScore * 0.2;
  }
  if (sportName.includes("strength")) {
    const sportScore = strengthSuitability(product);
    return focus === "Sport-specific" ? sportScore : base * 0.72 + sportScore * 0.28;
  }
  return base;
}

function candidateScore(product: PricedProduct, input: ConfigInput) {
  if (!product.priceCzk || product.bodyFocus === "Accessory" || product.line === "Kids Line") return -Infinity;
  let score = focusMetric(product, input.focus, input.sport) * 3;
  score += product.scores.variety * 0.35 + product.scores.beginner * 0.15;
  if (input.existingWorkout) score += product.scores.complement * 0.45;
  if (input.position !== "Doesn't matter") {
    const exact = product.position === input.position;
    const compatible = input.position === "Standing" && product.position.includes("Standing");
    score += exact || compatible ? 2.5 : -1.5;
  }

  const sportName = input.sport.toLowerCase();
  if (sportName.includes("soccer")) {
    score += soccerSuitability(product) * (input.specializationMode === "Maximum concentration" ? 0.65 : 0.4);
    if (product.line === "Gymnastics Line" && input.specializationMode !== "Balanced") score -= 0.8;
  } else if (sportName.includes("strength")) {
    score += strengthSuitability(product) * 0.45;
  }

  score += product.scores.affordability * 0.12;
  return score;
}

function movementSet(combo: Product[]) {
  const set = new Set<string>();
  combo.forEach((product) => product.movementPatterns.split(";").map((v) => v.trim()).filter(Boolean).forEach((v) => set.add(v)));
  return set;
}

function duplicatePatterns(combo: Product[]) {
  const counts = new Map<string, number>();
  combo.forEach((product) => product.movementPatterns.split(";").map((v) => v.trim()).filter(Boolean).forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1)));
  return [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
}

function targetCoverage(combo: Product[], input: ConfigInput) {
  return combo.reduce((sum, p) => sum + focusMetric(p, input.focus, input.sport), 0);
}

function metricsFor(combo: Product[], input: ConfigInput, totalPrice: number, budget: number): Record<PriorityKey, number> {
  const upper = combo.reduce((s, p) => s + p.coverage.upper, 0);
  const lower = combo.reduce((s, p) => s + p.coverage.lower, 0);
  const core = combo.reduce((s, p) => s + p.coverage.core, 0);
  const cardio = combo.reduce((s, p) => s + p.coverage.cardio, 0);
  const strengthMinimum = Math.min(upper, lower, core);
  const balance = clamp((strengthMinimum / Math.max(1, combo.length * 2)) * 10 + Math.min(2, cardio));
  const totalCoverage = upper + lower + core + cardio;
  const sportName = input.sport.toLowerCase();
  const specialization = sportName.includes("soccer")
    ? clamp(average(combo.map(soccerSuitability)) * 2.05)
    : sportName.includes("strength")
      ? clamp(average(combo.map(strengthSuitability)) * 2.1)
      : clamp((targetCoverage(combo, input) / Math.max(1, totalCoverage)) * 16);
  const patterns = movementSet(combo).size;
  const variety = clamp(patterns * 1.7 + average(combo.map((p) => p.scores.variety)) * 0.35);
  const beginner = clamp(average(combo.map((p) => p.scores.beginner)));
  const accessibility = clamp(average(combo.map((p) => p.scores.accessibility)));
  const users = combo.reduce((sum, p) => sum + capacityNumber(p.simultaneousUsers), 0);
  const throughput = clamp((users / combo.length) * 3.1);
  const knownFootprints = combo.map((p) => p.footprint).filter((v): v is number => typeof v === "number");
  const totalFootprint = knownFootprints.reduce((a, b) => a + b, 0);
  const usefulPatterns = Math.max(1, patterns);
  const space = knownFootprints.length ? clamp((usefulPatterns / Math.max(1, totalFootprint)) * 6) : clamp(average(combo.map((p) => p.scores.space)));
  const complement = input.existingWorkout ? clamp(average(combo.map((p) => p.scores.complement))) : 5;
  const budgetUse = clamp((1 - totalPrice / Math.max(budget, totalPrice)) * 4 + average(combo.map((p) => p.scores.affordability)) * 0.75 + variety * 0.25);
  return { balance, specialization, variety, beginner, accessibility, throughput, space, complement, value: budgetUse };
}

function scoreCombination(combo: Product[], input: ConfigInput, totalPrice: number, budget: number) {
  const metrics = metricsFor(combo, input, totalPrice, budget);
  const totalPoints = Object.values(input.priorities).reduce((a, b) => a + b, 0) || 20;
  let score = (Object.keys(input.priorities) as PriorityKey[]).reduce((sum, key) => sum + metrics[key] * (input.priorities[key] / totalPoints), 0);

  const duplicates = duplicatePatterns(combo);
  const specializationPoints = input.priorities.specialization;
  const modeFactor = input.specializationMode === "Maximum concentration" ? 0 : input.specializationMode === "Focused" ? 0.25 : input.specializationMode === "No preference" ? 0.45 : 0.8;
  const duplicatePenalty = duplicates * Math.max(0, 1 - specializationPoints / 10) * modeFactor;
  score -= duplicatePenalty;

  if (input.existingWorkout) {
    const highOverlap = combo.filter((p) => p.workoutOverlap === "High").length;
    score -= highOverlap * Math.max(0.1, input.priorities.complement / 10) * 0.7;
  }

  if (input.position !== "Doesn't matter") {
    const mismatches = combo.filter((p) => !p.position.includes(input.position.replace("Hanging / Bodyweight", "Hanging"))).length;
    score -= mismatches * 0.35;
  }

  const sportName = input.sport.toLowerCase();
  if (sportName.includes("soccer")) {
    const texts = combo.map(productText);
    const hasKneeDominant = texts.some((text) => /squat|leg press|knee-dominant/.test(text));
    const hasHamstrings = texts.some((text) => /leg curl|knee flexion|deadlift|combo lift|hip hinge/.test(text));
    const hasHipExtension = texts.some((text) => /hip thrust|glute press|deadlift|combo lift|hip extension/.test(text));
    const lowerBodyFamilies = [hasKneeDominant, hasHamstrings, hasHipExtension].filter(Boolean).length;
    const resistanceMachines = combo.filter((product) => ["Light Line", "Standard Line", "PRO Line", "Plus Line"].includes(product.line)).length;
    const bodyweightMachines = combo.filter((product) => product.line === "Gymnastics Line").length;

    // Specialisation may repeat a body region, while still rewarding a useful mix
    // of knee-dominant, hamstring and hip-extension work within that region.
    score += lowerBodyFamilies * 0.24;
    score += resistanceMachines * 0.18;
    if (input.specializationMode === "Maximum concentration") score -= bodyweightMachines * 0.16;
    if (combo.length >= 2 && !hasKneeDominant) score -= 0.85;
    if (combo.length >= 3 && !hasHamstrings) score -= 0.65;
    if (hasKneeDominant && hasHamstrings) score += 0.42;
    if (hasKneeDominant && hasHamstrings && hasHipExtension) score += 0.35;
  }

  score += Math.min(0.4, (totalPrice / Math.max(1, budget)) * 0.4);
  return { score: Number(clamp(score * 0.82).toFixed(3)), metrics };
}

function explanations(combo: Product[], metrics: Record<PriorityKey, number>, input: ConfigInput, locale: "en" | "cs") {
  const sorted = (Object.entries(metrics) as [PriorityKey, number][]).sort((a, b) => b[1] - a[1]);
  const labelsEn: Record<PriorityKey, string> = {
    balance: "balanced body coverage", specialization: "targeted specialization", variety: "exercise variety",
    beginner: "public usability", accessibility: "accessibility", throughput: "training capacity",
    space: "space efficiency", complement: "complementarity with the workout structure", value: "value for money",
  };
  const labelsCs: Record<PriorityKey, string> = {
    balance: "vyvážené zapojení těla", specialization: "cílenou specializaci", variety: "variabilitu cviků",
    beginner: "snadné použití pro veřejnost", accessibility: "přístupnost", throughput: "kapacitu cvičících",
    space: "efektivní využití prostoru", complement: "doplnění workoutové konstrukce", value: "poměr ceny a užitku",
  };
  const labels = locale === "cs" ? labelsCs : labelsEn;
  const strengthKeys = sorted.slice(0, 2).map(([key]) => labels[key]);
  const weakKey = sorted.at(-1)?.[0] ?? "balance";
  const focusName = input.focus === "Sport-specific" ? input.sport : input.focus;
  if (locale === "cs") {
    return {
      purpose: `Sestava zaměřená na ${focusName.toLowerCase()}, která zvýrazňuje ${strengthKeys.join(" a ")}.`,
      strengths: strengthKeys.map((v) => `Silná stránka: ${v}.`),
      weakness: `Hlavní kompromis: slabší hodnocení pro ${labels[weakKey]}.`,
    };
  }
  return {
    purpose: `A ${focusName.toLowerCase()} configuration that prioritizes ${strengthKeys.join(" and ")}.`,
    strengths: strengthKeys.map((v) => `Strong ${v}.`),
    weakness: `Main trade-off: lower score for ${labels[weakKey]}.`,
  };
}

function enumerateCombos(candidates: PricedProduct[], count: number, budgetCzk: number, limit = 12000) {
  const combos: { products: PricedProduct[]; price: number }[] = [];
  const walk = (start: number, selected: PricedProduct[], price: number) => {
    if (combos.length >= limit) return;
    if (selected.length === count) {
      combos.push({ products: [...selected], price });
      return;
    }
    for (let i = start; i < candidates.length; i++) {
      const p = candidates[i];
      const productPrice = p.priceCzk;
      if (!productPrice || price + productPrice > budgetCzk) continue;
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

export function recommend(products: PricedProduct[], input: ConfigInput, locale: "en" | "cs"): CombinationResult[] {
  const budgetCzk = input.budgetCzk * (1 - input.reservePercent / 100);
  let candidates = products
    .filter((product) => {
      if (!product.priceCzk || product.priceCzk > budgetCzk || product.bodyFocus === "Accessory" || product.line === "Kids Line") return false;
      if (input.strictPosition && input.position !== "Doesn't matter" && !product.position.includes(input.position.replace("Hanging / Bodyweight", "Hanging"))) return false;
      return true;
    })
    .sort((a, b) => candidateScore(b, input) - candidateScore(a, input));

  const focusedProfile = input.focus !== "Full Body" || input.sport !== "General Public" || input.specializationMode !== "Balanced";
  const poolSize = input.machineCount === "auto" ? (focusedProfile ? 25 : 22) : Number(input.machineCount) >= 5 ? 20 : (focusedProfile ? 28 : 24);
  candidates = candidates.slice(0, poolSize);

  const candidatePrices = candidates.map((p) => p.priceCzk).filter((v): v is number => typeof v === "number").sort((a, b) => a - b);
  const referencePrice = candidatePrices.length ? candidatePrices[Math.floor((candidatePrices.length - 1) * 0.78)] : budgetCzk;
  const inferredCount = Math.max(1, Math.min(5, Math.floor(budgetCzk / Math.max(1, referencePrice))));
  const counts = input.machineCount === "auto" ? [inferredCount] : [Number(input.machineCount)];

  const scored: CombinationResult[] = [];
  counts.forEach((count) => {
    enumerateCombos(candidates, count, budgetCzk).forEach(({ products: combo, price }) => {
      const { score, metrics } = scoreCombination(combo, input, price, budgetCzk);
      const footprintValues = combo.map((p) => p.footprint).filter((v): v is number => typeof v === "number");
      const copy = explanations(combo, metrics, input, locale);
      scored.push({
        id: combo.map((p) => p.code).join("+"),
        products: combo,
        totalEur: price / Math.max(1, input.exchangeRate),
        totalCzk: price,
        footprint: footprintValues.length === combo.length ? footprintValues.reduce((a, b) => a + b, 0) : null,
        score,
        metrics,
        ...copy,
      });
    });
  });

  scored.sort((a, b) => b.score - a.score);
  const diverse: CombinationResult[] = [];
  for (const candidate of scored) {
    const similarityLimit = candidate.products.length <= 2 ? 0.3 : 0.5;
    if (diverse.every((selected) => jaccard(selected.products, candidate.products) < similarityLimit)) diverse.push(candidate);
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
