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
// Weightlifting = Yes turns on the base lines; the two "premium" lines only join
// when the Cost↔Use slider reaches COST_PREMIUM_THRESHOLD ("no limit" end).
export const WEIGHTLIFTING_BASE_LINES = ["standard-line", "light-line"];
export const WEIGHTLIFTING_PREMIUM_LINES = ["pro-line", "plus-line"];
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

// Converging/diverging machines: used when Cost↔Use is at the "no limit" end, avoided when "cheap".
export const CONVERGING_DIVERGING_CODES = ["MB 7.52", "MB 7.53", "MB 7.54", "MB 7.55", "MB 7.100"];

// When a workout structure already exists: exclude these lines outright…
export const EXISTING_WORKOUT_EXCLUDE_LINES = ["workout-line"];
// …and lower the priority of these machines (they duplicate a pull-up / calisthenics rig).
export const DEPRIORITIZE_WHEN_WORKOUT_CODES = ["MB 7.38", "MB 7.55", "MB 7.47", "MB 7.47/1", "MB 7.61", "MB 7.73", "MB 7.62", "MB 7.67", "MB 7.96"];

// --- Slider thresholds (1..5, 3 = neutral) ---------------------------------
export const COST_CHEAP_MAX = 2; // 1–2 = "as cheap as possible" band (avoid Pro/Plus + conv/div)
export const COST_PREMIUM_THRESHOLD = 4; // 4–5 = "no limit" band (add Pro/Plus, prefer conv/div)
export const PUBLIC_MAX = 2; // 1–2 = "public" band (avoid dumbbells + boxing)

// --- Slider end/middle labels ----------------------------------------------
export const sliderLabels = {
  balanceSpecialised: { en: ["Balanced", "No preference", "Specialised"], cs: ["Vyvážené", "Bez preference", "Specializované"] },
  publicPrivate: { en: ["Public", "No preference", "Private"], cs: ["Veřejné", "Bez preference", "Soukromé"] },
  costUse: { en: ["As cheap as possible", "No preference", "No limit"], cs: ["Co nejlevněji", "Bez preference", "Bez limitu"] },
} as const;

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
    if (s.costUse >= COST_PREMIUM_THRESHOLD) WEIGHTLIFTING_PREMIUM_LINES.forEach((l) => set.add(l));
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
