// Canonical muscle groups for the highlightable body figure. Shared by the
// public product page and the /system/catalog editor (client-safe, no server deps).

export const muscleKeys = [
  "neck",
  "shoulders",
  "chest",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "back",
  "lowerBack",
  "glutes",
  "quads",
  "adductors",
  "hamstrings",
  "calves",
] as const;

export type MuscleKey = (typeof muscleKeys)[number];

export const muscleLabels: Record<MuscleKey, { en: string; cs: string }> = {
  neck: { en: "Neck / traps", cs: "Krk / trapézy" },
  shoulders: { en: "Shoulders", cs: "Ramena" },
  chest: { en: "Chest", cs: "Prsa" },
  biceps: { en: "Biceps", cs: "Biceps" },
  triceps: { en: "Triceps", cs: "Triceps" },
  forearms: { en: "Forearms", cs: "Předloktí" },
  abs: { en: "Abs / core", cs: "Břicho / core" },
  obliques: { en: "Obliques", cs: "Šikmé břišní" },
  back: { en: "Upper back / lats", cs: "Záda / široký sval" },
  lowerBack: { en: "Lower back", cs: "Spodní záda" },
  glutes: { en: "Glutes", cs: "Hýždě" },
  quads: { en: "Quadriceps / thighs", cs: "Stehna přední" },
  adductors: { en: "Inner / outer thigh", cs: "Vnitřní / vnější stehna" },
  hamstrings: { en: "Hamstrings", cs: "Stehna zadní" },
  calves: { en: "Calves", cs: "Lýtka" },
};

// Best-effort mapping of the free-text "Target muscles" field to muscle keys.
const detectors: [RegExp, MuscleKey[]][] = [
  [/chest|pector/i, ["chest"]],
  [/shoulder|delt/i, ["shoulders"]],
  [/neck|trapez/i, ["neck"]],
  [/biceps(?!\s*femoris)/i, ["biceps"]],
  [/triceps/i, ["triceps"]],
  [/forearm|grip/i, ["forearms"]],
  [/\babs\b|abdomin|core/i, ["abs"]],
  [/oblique/i, ["obliques"]],
  [/lower\s*back|erector|spinae/i, ["lowerBack"]],
  [/(?<!lower\s)back|lats|latissimus/i, ["back"]],
  [/glute/i, ["glutes"]],
  [/quad|thig|thigh/i, ["quads"]],
  [/inner\s*thigh|outer\s*thigh|adductor|abductor/i, ["adductors"]],
  [/hamstring|biceps\s*femoris/i, ["hamstrings"]],
  [/calf|calv|gastro|soleus/i, ["calves"]],
  [/\blegs?\b/i, ["quads", "hamstrings", "calves"]],
];

export function detectMuscles(musclesText: string): MuscleKey[] {
  const found = new Set<MuscleKey>();
  for (const [pattern, keys] of detectors) {
    if (pattern.test(musclesText)) keys.forEach((key) => found.add(key));
  }
  return muscleKeys.filter((key) => found.has(key));
}
