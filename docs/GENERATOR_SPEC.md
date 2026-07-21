# Recommended-Configurations Generator — 2026 redesign spec

Source: owner's `GENERATOR edit.docx` (2026-07-21) + clarifications. This is the
authoritative spec for the simplified configurator. Results output is unchanged.

> **The editable rules live in one file: `lib/generator-rules.ts`.** That is the code
> "map" — machine-code lists, which lines each answer enables, the slider thresholds,
> defaults and labels — all in one commented place, read by both the configurator UI and
> the server recommender. Change a rule there (or ask Claude), and this doc for the why.

## 1. Budget & scope

- **Total budget**: default **500 000 CZK**. Hard filter only when machine count is "Auto".
- **CZK/EUR rate**: prefilled from the **Czech National Bank** daily fixing (the official
  single mid rate) via `/api/exchange-rate`; still manually editable. EUR shown as ≈ secondary.
- **Machine count**: `Auto` (use budget) or a fixed number. **If a fixed count is chosen the
  budget is ignored** — pick the N best-scoring machines regardless of total price (price still
  shown in results).
- **Available space**: two editable number fields A (m) × B (m) → computed **m²** (also
  editable). **Soft preference**, ~**6 m² per machine**: setups whose machine count exceeds
  `floor(space / 6)` are penalised in ranking, not excluded.

## 2. Category bar (9 line chips)

Small chips across the top, one per product line. **Red = included in the search, black =
excluded.** Driven live by the answers below; **Standard + Light lit by default**.

Two-way: clicking a chip flips the answer that controls its line, and the linked question
briefly **pulses** (animates up/back) to show the chip drove it. Likewise, changing an answer
re-lights the chips.

Chip ↔ control mapping:
- Standard, Light ← Weightlifting (always the two default-on lines)
- Pro, Plus ← Weightlifting **and** cost↔use slider (see §4c) / Plus also via wheelchair & seated
- Workout ← Bodyweight
- Cardio, Gymnastics ← Cardio & stretching
- Kids ← Kids
- Boxing ← "Include a boxing bag?"

## 3. Questions (each switches whole lines in/out)

- **Existing workout structure?** Yes/No (default No). If **Yes** → exclude the whole **Workout
  line** (calisthenics) and **lower the priority** (not exclude) of machines that duplicate a
  pull-up/calisthenics rig: MB 7.38, 7.55, 7.47, 7.47/1, 7.61, 7.73, 7.62, 7.67, 7.96.
- **Add bodyweight (calisthenics)?** Yes/No (default No). Yes → include **Workout line**
  (single category; no Pro/Basic split).
- **Primary focus**: Full body (default) / Upper body / Lower body.
- **Weightlifting?** Yes/No (default **Yes**) → Standard, Light (+ Pro, Plus per cost slider).
- **Cardio & stretching?** Yes/No (default No) → Cardio, Gymnastics.
- **Kids?** Yes/No (default No) → Kids line.
- **Include a boxing bag?** Yes/No (default No) → Boxing line.
- **Wheelchair accessible?** Yes/No (default No) → restrict to accessible machines (Plus line).
- **Position preference**: Seated / Standing / Doesn't matter (default). Seated → Light, Plus
  (also honours each machine's `position` field).

## 4. Priorities — three bipolar sliders, 1–5, default 3 (= no filtering)

Each slider shows a label at the left end, middle, and right end.

a. **Balanced ↔ Specialised** — labels: `Balanced` · `No preference` · `Specialised`.
   Balanced → prefer full-body machines. Specialised + Upper/Lower focus → prefer machines that
   target that region.

b. **Public ↔ Private** — labels: `Public` · `No preference` · `Private`.
   Public (1–2) → avoid **dumbbell sets** (MB 7.33, 7.34, 7.71, 7.72) and the **Boxing line**
   ("loose barbells and box series").

c. **Cost ↔ Use** — labels: `As cheap as possible` · `No preference` · `No limit`.
   - 1–2: prefer Light over Standard, **avoid Pro & Plus**, avoid converging/diverging machines.
   - 3: no filtering (default).
   - 4–5: prefer Standard/Pro/Plus, **use converging/diverging** machines (MB 7.52, 7.53, 7.54,
     7.55, 7.100).

## 5. Results

Unchanged from the current generator (ranked cards, /10 score, CZK price ≈ EUR, metric bars,
strengths, trade-off, PDF).

## Interpretation notes (flag to owner if wrong)

- "Standard + Light lit by default" wins over "cost = 3 filters nothing": **Pro & Plus are
  excluded until the cost slider ≥ 4** (or wheelchair/seated pulls Plus in). Easy to flip.
- "Box series" = the **Boxing line** (owner confirmed).
- Deprioritise list above is the owner's named machines mapped to the closest codes; editable.
