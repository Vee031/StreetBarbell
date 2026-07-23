// ============================================================================
//  THE GENERATOR RULES MAP
//  This is the single place to change how the recommended-configurations
//  generator behaves. Edit the lists / numbers below (or just tell Claude the
//  change and it will apply it — safer, since a stray comma breaks the build).
//  Plain-English version of every rule: docs/GENERATOR_SPEC.md.
//
//  This file is client-safe (no server imports) so both the configurator UI
//  and the server-side recommender read from it — change a rule once, here.
// ============================================================================

// --- Product lines: chip order + labels shown in the category bar ---------
export const LINES: { slug: string; en: string; cs: string }[] = [
  { slug: "standard-line", en: "Standard", cs: "Standard" },
  { slug: "light-line", en: "Light", cs: "Light" },
  { slug: "pro-line", en: "Pro", cs: "Pro" },
  { slug: "plus-line", en: "Plus", cs: "Plus" },
  { slug: "workout-line", en: "Workout", cs: "Workout" },
  { slug: "cardio-line", en: "Cardio", cs: "Cardio" },
  { slug: "gymnastics-line", en: "Gymnastics", cs: "Gymnastika" },
  { slug: "boxing-line", en: "Boxing", cs: "Box" },
  { slug: "kids-line", en: "Kids", cs: "Děti" },
];
export const ALL_LINE_SLUGS = LINES.map((l) => l.slug);

// --- Scope defaults --------------------------------------------------------
export const DEFAULT_BUDGET_CZK = 500_000;
export const FALLBACK_EXCHANGE_RATE = 25; // used until the CNB rate loads / if it fails
export const SPACE_PER_MACHINE_M2 = 6; // soft preference: setups above space/6 machines are penalised

// --- Which product lines each answer enables -------------------------------
// Weightlifting = Yes turns on the base lines. The premium lines join separately
// (owner 2026-07-22): Plus from COST_PREMIUM_THRESHOLD (4–5), Pro ONLY at
// COST_PRO_THRESHOLD (5, "no limit").
export const WEIGHTLIFTING_BASE_LINES = ["standard-line", "light-line"];
export const WEIGHTLIFTING_PLUS_LINES = ["plus-line"];
export const WEIGHTLIFTING_PRO_LINES = ["pro-line"];
// Both premium lines together — used by scoring and the seated filter.
export const WEIGHTLIFTING_PREMIUM_LINES = [...WEIGHTLIFTING_PRO_LINES, ...WEIGHTLIFTING_PLUS_LINES];
export const BODYWEIGHT_LINES = ["workout-line"];
export const CARDIO_STRETCHING_LINES = ["cardio-line", "gymnastics-line"];
export const KIDS_LINES = ["kids-line"];
export const BOXING_LINES = ["boxing-line"];
export const WHEELCHAIR_LINES = ["plus-line"]; // wheelchair = Yes restricts the whole search to these
export const SEATED_LINES = ["light-line", "plus-line"]; // seated keeps only these among the weightlifting lines

// --- Machine-code rule lists (edit to change which machines a rule targets) --
// Public installations avoid these "loose barbell" machines and the box series.
export const PUBLIC_AVOID_CODES = ["MB 7.33", "MB 7.34", "MB 7.71", "MB 7.72"]; // dumbbell sets
export const PUBLIC_AVOID_LINES = ["boxing-line"]; // "box series"

// #1 — treat these machines as belonging to a different line group inside the
// generator only (their real line on the website is unchanged).
export const PRODUCT_LINE_OVERRIDES: Record<string, string> = {
  "MB 7.47": "workout-line", // Multi Workout Station
  "MB 7.47/1": "workout-line", // Roofless Multi Workout Station
};
export function effectiveLineSlug(code: string, lineSlug: string): string {
  return PRODUCT_LINE_OVERRIDES[code] ?? lineSlug;
}

// #3 — when bodyweight training is NOT selected, the Workout line is already
// excluded (via line inclusion); also drop these Light-line machines.
export const EXCLUDE_WHEN_NO_BODYWEIGHT_CODES = ["MB 7.62", "MB 7.61"]; // AB Bench & Hyperextension, Combination Exerciser

// #6 — with multiple machines, at least half must come from Standard/Light.
export const PREFERRED_CORE_LINES = ["standard-line", "light-line"];
export const MAX_OTHER_SHARE = 0.5; // ≤ 50% of a setup may be from other lines

// Converging/diverging machines: used when Cost↔Use is at the "no limit" end, avoided when "cheap".
export const CONVERGING_DIVERGING_CODES = ["MB 7.52", "MB 7.53", "MB 7.54", "MB 7.55", "MB 7.100"];

// When a workout structure already exists: exclude these lines outright…
export const EXISTING_WORKOUT_EXCLUDE_LINES = ["workout-line"];
// …and lower the priority of these machines (they duplicate a pull-up / calisthenics rig).
export const DEPRIORITIZE_WHEN_WORKOUT_CODES = ["MB 7.38", "MB 7.55", "MB 7.47", "MB 7.47/1", "MB 7.61", "MB 7.73", "MB 7.62", "MB 7.67", "MB 7.96"];

// #2 — never put two machines from the same "exercise family" in one setup
// (e.g. Squat + Squat, Chest Press + Converging Chest Press, both Dumbbell sets).
// The family is derived from the machine name by stripping variant words below.
// Workout-line structures (ladders, bars…) are left un-deduped — a park can hold
// several. FAMILY_OVERRIDES pins any name the auto-rule gets wrong (code -> family).
export const FAMILY_OVERRIDES: Record<string, string> = {
  // Vertical Press and Shoulder Press are the same movement (owner 2026-07-21).
  "MB 7.29": "shoulder press", // Vertical Press
  "MB 7.54": "shoulder press", // Convergent Vertical Press
  "MB 7.63": "shoulder press", // Shoulder Press (Light)
  "MB 7.29.3": "shoulder press", // Shoulder Press (Plus)
  // Lat Pull and Lat Pulldown stay separate — different muscle groups (owner 2026-07-21).
};

// Premium "converging/diverging" variants are the best version and are preferred as
// the family's pick from neutral cost upward; only the cheap band drops them for Light.
export const PREFER_PREMIUM_FROM_NEUTRAL = true;
const FAMILY_STRIP =
  /\b(light|heavy|version|wch|roofless|roof|assisted|converging|convergent|diverging|divergent|reverse|seated|standing|flat|incline|inclined|adjustable|outdoor|machine|combined|combination|start|variable|load|leverage|type [a-h]|for kids|kids)\b/g;

export function exerciseFamily(code: string, nameEn: string, effectiveLine: string): string {
  if (FAMILY_OVERRIDES[code]) return FAMILY_OVERRIDES[code];
  if (effectiveLine === "workout-line") return `unique:${code}`; // never dedupe workout structures
  const family = ` ${nameEn.toLowerCase()} `
    .replace(/\([^)]*\)/g, " ")
    .replace(FAMILY_STRIP, " ")
    .replace(/[^a-z]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return family || `unique:${code}`;
}

// --- Slider thresholds (1..5, 3 = neutral) ---------------------------------
export const COST_CHEAP_MAX = 2; // 1–2 = "as cheap as possible" band (avoid Pro/Plus + conv/div)
export const COST_PREMIUM_THRESHOLD = 4; // 4–5 adds the Plus line (and prefers conv/div)
export const COST_PRO_THRESHOLD = 5; // ONLY 5 ("no limit") adds the Pro line
export const PUBLIC_MAX = 2; // 1–2 = "public" band (avoid dumbbells + boxing)

// --- Slider end/middle labels ----------------------------------------------
// Body coverage runs Lower body ↔ Upper body (owner 2026-07-23); the middle is
// "no preference" = balanced full-body. The slider therefore also carries the
// primary focus — the old separate Focus dropdown is gone.
export const sliderLabels = {
  balanceSpecialised: { en: ["Lower body", "No preference", "Upper body"], cs: ["Dolní část těla", "Bez preference", "Horní část těla"] },
  publicPrivate: { en: ["Public", "No preference", "Private"], cs: ["Veřejné", "Bez preference", "Soukromé"] },
  costUse: { en: ["As cheap as possible", "No preference", "No limit"], cs: ["Co nejlevněji", "Bez preference", "Bez limitu"] },
} as const;

// Step 4 "personal preferences": when the machine count is automatic, the number
// of choose/avoid slots = budget / this amount (at least 1, at most 6).
export const BUDGET_PER_MACHINE_SLOT = 149_000;

// --- Line selection: turns the answers into the set of lines the search uses --
export type LineSelectionInput = {
  weightlifting: boolean;
  bodyweight: boolean;
  existingWorkout: boolean;
  cardioStretching: boolean;
  kids: boolean;
  boxingBag: boolean;
  wheelchair: boolean;
  position: "seated" | "standing" | "any";
  costUse: number;
};

export function deriveLines(s: LineSelectionInput): string[] {
  if (s.wheelchair) return [...WHEELCHAIR_LINES];
  const set = new Set<string>();
  if (s.weightlifting) {
    WEIGHTLIFTING_BASE_LINES.forEach((l) => set.add(l));
    if (s.costUse >= COST_PREMIUM_THRESHOLD) WEIGHTLIFTING_PLUS_LINES.forEach((l) => set.add(l));
    if (s.costUse >= COST_PRO_THRESHOLD) WEIGHTLIFTING_PRO_LINES.forEach((l) => set.add(l));
  }
  if (s.bodyweight && !s.existingWorkout) BODYWEIGHT_LINES.forEach((l) => set.add(l));
  if (s.cardioStretching) CARDIO_STRETCHING_LINES.forEach((l) => set.add(l));
  if (s.kids) KIDS_LINES.forEach((l) => set.add(l));
  if (s.boxingBag) BOXING_LINES.forEach((l) => set.add(l));
  if (s.position === "seated") {
    // seated keeps only the seated-friendly weightlifting lines
    for (const line of WEIGHTLIFTING_BASE_LINES.concat(WEIGHTLIFTING_PREMIUM_LINES)) {
      if (!SEATED_LINES.includes(line)) set.delete(line);
    }
    if (s.weightlifting) SEATED_LINES.forEach((l) => set.add(l));
  }
  return [...set];
}
