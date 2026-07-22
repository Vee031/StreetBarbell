# PROJECT_STATUS — streetbarbell.cz

> **Read this first in any follow-up session.** It is the authoritative status doc for the
> Street Barbell web app, written so the project can be picked up (or rebuilt) from scratch.
> Last checkpoint: **2026-07-22**. It supersedes the older
> `STREETBARBELL_CODEX_HANDOVER_COMPLETE.md` (one folder tree up, kept for history).

## Where we left off (2026-07-22)

Everything requested so far is **built, deployed and verified live**. No half-finished work.

**2026-07-22 (third batch — admin restyle + line moves + menu unify):**

1. `/system/groups` is now **"Website management"** styled after the owner's RVL13 admin
   (system.rvl13.com "Menu a stránky"): hierarchical table (name / status pill / level /
   actions) showing built-in Products→lines (read-only, products managed in Catalogue) plus
   the custom categories & groups with **Aktivní/Neaktivní toggles** (inactive = hidden from
   the menu, page 404s, data kept), **↑/↓ reorder**, delete, inline product selection, and
   link items with menu-card **subtitle** fields (subtitleEn/Cs) on top of the tooltip.
2. **Category (line) change per product**: catalog card has a "Category (product line)"
   dropdown (plus a "Line" column in the XLSX template) — writes `lineSlug` into the
   overrides store; `applyOverride` re-homes line/lineCs/lineSlug. **MB 7.47 Multi Workout
   Station was moved Standard→Workout live** (owner's example; matches the generator's
   internal PRODUCT_LINE_OVERRIDES rule).
3. **Front-end menu unified**: category dropdowns render the same card design as the
   Products mega menu (`.mega-item` reused) — label + subtitle ("N kombinací/combinations"
   for product groups, configured subtitle for links, e.g. "Nekonečno kombinací" on the
   configurator card). Seeded order now: Bez workoutu · S workoutem · Konfigurátor sestav.

**2026-07-22 (second batch)** — five owner requests:

1. **Pro/Plus separated in the generator**: Plus line joins at Cost↔Use ≥ 4, **Pro only at 5**
   ("no limit") — `COST_PRO_THRESHOLD` in `lib/generator-rules.ts`; the Pro/Plus chips
   toggle independently (Pro chip = cost 5 ↔ 4, Plus chip = cost 4 ↔ 3). Spec updated.
2. **Exercise position editable** per machine in `/system/catalog/<slug>` (9 canonical
   values, `POSITION_OPTIONS` in `lib/products-store.ts`). Saved into the same
   `content/product-overrides.json` store the XLSX import uses, so the spreadsheet
   template round-trips it.
3. **Menu categories & product groups** (`/system/groups`, `lib/product-groups.ts`, blob
   `content/product-groups.json`): admin creates categories (nav dropdowns) holding
   product groups (pages at `/{locale}/g/<category>/<group>`) and/or link items with an
   optional hover tooltip (`.nav-tooltip`). The built-in "Recommended configurations" nav
   link hides itself when a category links to `/configurations` (no duplicate). Seeded
   live: category **Recommended setups / Doporučené sestavy** → S workoutem (2 machines),
   Bez workoutu (empty), Konfigurátor sestav → /configurations with tooltip "Vytvořte si
   vlastní sestavu dle vlastních preferencí".
4. **Add product** (`/system/catalog/new`): admin-created machines stored in blob
   `content/custom-products.json`, expanded via `customToProduct()` and merged into
   `getProducts()`. They appear in their line, product lists, detail page, groups and the
   XLSX template (import accepts their codes; diffs computed against the created values),
   are fully editable in the catalogue card (photos/docs/video/muscles/position/on-off,
   plus **Delete product**, which also cleans meta/overrides/group refs) — but are
   **excluded from the configurator** (no scores/prices; filtered in /api/recommend).
5. Group pages & custom products render on demand (`force-dynamic`); nav data flows
   `layout.tsx → buildGroupNav() → Header` (client) as a serializable prop.

Earlier that day: the configurator became **public** — the distributor access-code gate is
gone (`app/api/access` + `lib/server-auth.ts` deleted, `STREETBARBELL_DISTRIBUTOR_CODE`
unused). Real prices are shown **only to signed-in team members**: per-email accounts
managed by the admin at `/system/users`, sign-in at `/{locale}/team-login` (subtle link in
the header). Anonymous users get the same setups with prices replaced by "UNDER <budget>"
(or "NOT FILLED IN" when the budget was left blank), no PDF button, and a "Request a quote"
mailto to export@rvl13.com prefilled with the machines + the full brief. Also in the same
batch ("generator rules batch 2"): budget may be left blank (blank → 3-machine default
setup size), converging/diverging variants preferred as their family's pick from neutral
cost upward (`PREFER_PREMIUM_FROM_NEUTRAL`), Vertical/Shoulder Press pinned to one family
via `FAMILY_OVERRIDES`, and result cards show machine thumbnails.

**2026-07-21**: the recommended-configurations generator was redesigned per the owner's
`GENERATOR edit.docx` — see **`docs/GENERATOR_SPEC.md`** for the full spec (budget/space/
category-bar/questions/sliders) and the owner's clarifying answers baked into it. Commit
`c40df6f`, then all rules consolidated into `lib/generator-rules.ts` (`d58c73b`) and
"rules batch 1" — family grouping/de-dup, no-bodyweight, layout (`ab3ecc5`). This replaces
the old 9-point-priorities / EUR-manual-rate configurator described in older notes below —
if anything here conflicts with GENERATOR_SPEC.md, the spec wins.

Also shipped earlier the same week: `/system` admin (login + site-text editor + product
catalogue with per-product visibility/gallery/docs/video/muscle-map), English machine names on
/cs, configurator on the CZK 2026 pricelist, `/system/products` bulk XLSX import, and the
click-to-edit muscle figure (exact catalog artwork).

Open follow-ups (nice-to-haves, none urgent):

1. More gallery photos can be curated from the Google Drive "Photos" folder (399 available,
   folder id `1FtMcSEhwRMt3VyEzMbJvuxRuTa5RSyBQ`).
2. `/system` and `/team-login` logins have no rate-limiting (fine for now; add lockout if
   ever needed).
3. Removing a team member does **not** invalidate an already-issued session cookie (the
   cookie is signature-only, up to 30 days) — acceptable trade-off chosen to avoid a blob
   read per request; rotate `STREETBARBELL_APP_SECRET` to force-logout everyone.

## What this is

Bilingual (EN/CS) marketing site + distributor-only recommendation configurator for
**Street Barbell** (RVL13 outdoor gym machines). 116 products in 9 lines.

- **Live:** https://streetbarbell.cz (apex; `www` 308-redirects to apex)
- **Owner:** Vojta (v.khodl@gmail.com)
- **GitHub:** https://github.com/Vee031/StreetBarbell (public — never commit secrets)
- **Local source:** `C:\Users\ASUS\Dropbox\0001. BALI\00000001 AI COMPLETE\StreetBarbell Webpage\Sestavy - Street Barbell\StreetBarbell_WebApp_v1\StreetBarbell`
- **Vercel:** project `street-barbell`, team `vee031-1571s-projects` (Hobby), git-connected —
  **every push to `main` auto-deploys production**. CLI is logged in on this machine
  (token at `%APPDATA%\xdg.data\com.vercel.cli\auth.json`, teamId `team_cflbsGMD9bMHsmBmyF7z7MNS`).
- **DNS:** Wedos. Apex A → `64.29.17.1`, `www` CNAME → `3a01e0304b2b0837.vercel-dns-017.com`.

## Stack

Next.js 16.2.10 (App Router), React 19, no database, no Tailwind (hand-written CSS in
`app/globals.css`, Barlow Condensed + Inter). `framer-motion`, `lucide-react`, `jspdf`
(configurator PDF), `@vercel/blob` (admin text overrides).

## Environment variables (values in the PRIVATE file, never in git)

Values live in
`...\StreetBarbell Webpage\VERCEL_ENV_VALUES - PRIVATE - do not commit.txt`
and in Vercel → Settings → Environment Variables (Production). Local dev uses `.env.local`.

| Variable | Purpose |
|---|---|
| `STREETBARBELL_DISTRIBUTOR_CODE` | **Unused since 2026-07-22** (access-code gate removed; still set in Vercel, harmless) |
| `STREETBARBELL_APP_SECRET` | HMAC secret for all session cookies (admin + team) and team password hashes |
| `STREETBARBELL_PRICELIST_JSON` | **Active configurator pricing** — 2026 pricelist, one CZK price (excl. VAT) per code |
| `STREETBARBELL_PRICING_JSON` | Legacy 6-variant EUR distributor prices — no longer read by code, kept as the source for regenerating the pricelist fallback |
| `STREETBARBELL_ADMIN_PASSWORD` | Login for the `/system` text editor |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store `streetbarbell-content` (auto-added by store link) |

Gotcha: adding env values via PowerShell piping appends `\r` that Vercel keeps. Use
`cmd /c "npx vercel env add NAME production < file"` with a file that has **no trailing newline**.

## Architecture map

- `app/[locale]/…` — public pages (en/cs): home, products, products/[line], products/[line]/[slug],
  configurations (configurator), gallery, contact. All SSG via `generateStaticParams`.
- `app/api/recommend` — scored recommendations, **public** since 2026-07-22; totals are
  returned only when a team-member cookie is present (`priced` flag in the response),
  per-machine prices are never returned at all. `app/api/team-status` — who is signed in
  (used by the header). `app/api/exchange-rate` — daily CZK/EUR mid rate from the Czech
  National Bank fixing (12h cache, hardcoded 25 fallback on fetch error).
- `app/[locale]/team-login` — team sign-in (server actions login/logout). `app/system/users`
  — admin CRUD for team members. `lib/team-auth.ts` — signed session cookie
  `streetbarbell_team` (HMAC of email, 30 days). `lib/team-users.ts` — users in Blob
  `content/team-users.json`, passwords stored only as HMAC hashes (never readable back).
- `app/system` — **admin text editor** (see below). `app/system/login` — password login.
- `lib/i18n.ts` — the full EN/CS dictionary of site texts (single source of default wording,
  including footer/menu/benefit/gallery-filter texts) + Czech plural helper `countNoun`.
- `lib/site-texts.ts` — `getSiteTexts(locale)`: merges admin overrides (Vercel Blob JSON at
  `content/site-texts.json`) over the dictionary; `unstable_cache` with tag `site-texts`;
  blob reads are timeboxed (5s) and cache-busted with `?v=<uploadedAt>`.
- `lib/admin-auth.ts` / `lib/team-auth.ts` — same pattern twice: HMAC(secret, message) as a
  cookie value, timing-safe compares. Admin cookie `streetbarbell_admin`, team cookie
  `streetbarbell_team`. (The old distributor cookie/`lib/server-auth.ts` was removed 2026-07-22.)
- `lib/data.ts` — products/lines from `data/products.json` + `data/lines.json`.
  **`getProductName()` always returns the English name — owner decision 2026-07-17: machine
  names are shown in original English on both language versions.** Descriptions/lines stay localized.
- `lib/server-pricing.ts` — configurator prices from `STREETBARBELL_PRICELIST_JSON` (CZK-native
  since 2026-07-17): 39 machines carry the official "Pricelist StreetBarbell 2026" PDF price
  (source PDF: `C:\Users\ASUS\OneDrive\Plocha\Pricelist StreetBarbell 2026.pdf`); the other 77 =
  distributor powder-coating price (pcDiscount) × 2, converted at 25 CZK/EUR, rounded to 1,000 CZK
  (owner's rule). Note MB 7.54 is 130,000 in the PDF while the rest of Standard is 139,000 — taken
  as written. Regeneration script preserved at the bottom of this section's history in git
  (`scratchpad/gen_pricelist.py` in session; recreate from this description if needed).
  The old coating/price-basis dropdown was removed from the configurator — single pricelist,
  results show CZK primary with ≈€ via the user-set exchange rate.
  **`lib/recommender.ts` — rewritten 2026-07-21 for the simplified generator; see
  `docs/GENERATOR_SPEC.md` for the full input/filtering/scoring spec** (category-bar line
  inclusion, 3 bipolar 1-5 sliders, fixed-count-overrides-budget, soft space preference).
  `lib/pdf-font.ts` — subsetted DejaVu Sans (Czech diacritics in PDF).
- `components/` — header (client; receives texts as prop `d`), footer, product-card (takes
  `t={d.products}`), line-card, configurator (client), contact-form, motion-reveal.
- `scripts/check-public-data.mjs` — CI guard: public products.json must contain no prices.

## /system admin (added 2026-07-17, commit 679546e; dashboard + top bar 2026-07-22)

- `streetbarbell.cz/system` — password login (30-day httpOnly cookie), noindex. Since
  `658f6f6`, `/system` is a **dashboard** (stat tiles per section) and every admin page
  carries the sticky `SystemNav` top bar (components/system-nav.tsx — brand block, big
  tabs with red active highlight, open-website, sign-out). The **site-texts editor lives
  at `/system/texts`** now.
- Editor: 8 section cards (nav, home, products, config, gallery, contact, common, footer),
  every dictionary key editable in EN and CS side by side. **Empty a field + save = reset to
  the built-in default.** Overridden fields show a red "· edited" tag.
- Storage: diffs-only JSON in public Vercel Blob store `streetbarbell-content`
  (`content/site-texts.json`). Save = `put()` → `updateTag("site-texts")` +
  `revalidatePath("/", "layout")` → changes live in seconds.
- **Next 16 cache gotcha:** `revalidateTag(tag, "max")` is SWR-ish and near-useless for
  read-your-writes; **`updateTag(tag)`** is the immediate expire. Don't "fix" this back.
- Blob CDN serves the previous JSON for a few seconds after a save → the editor form can
  briefly show pre-save values (site itself updates correctly). Harmless; refresh.
- Machine names/specs/prices are edited via the **Products import** page instead (below), not
  the text editor.

## /system/products — bulk product import (added 2026-07-17)

- Workflow: download `products.xlsx` (always reflects live data incl. previous uploads) →
  edit anything except the Code column → upload → live in seconds.
- 35 editable columns per machine: Price CZK excl. VAT, names EN/CS, descriptions EN/CS,
  muscles/focus/movement/position, users, load spec, plate load, weight, footprint,
  dimensions, materials, coverage + recommender scores, website URL.
- Semantics: uploaded values are stored as diffs-only overrides in Blob
  (`content/product-overrides.json`), merged over `data/products.json` at read time
  (`lib/products-store.ts`, cache tag `products`). **Empty cell = revert to built-in value.**
  Each upload atomically replaces the whole override set (the template contains current
  values, so unchanged cells re-assert themselves). Price overrides also feed the
  configurator via `getEffectivePricelist()`.
- Validation: unknown codes / non-numeric / negative numbers → import is checked but NOT
  applied; errors listed on the page (last-import report stored at
  `content/product-import-report.json`). Template generation + parsing use `exceljs`;
  XLSX only (Czech CSV encoding/delimiters are unreliable). Server-action body limit
  raised to 8 MB in next.config.ts.

## /system/catalog — product catalogue admin (added 2026-07-18)

- Grid of all 116 machines (grouped by line, On/Off badges) → per-product editor:
  - **On/Off switch**: switched-off machines vanish from product lists, their detail page
    404s, and the configurator excludes them. Line pages show the live machine count.
  - **Pictures**: official render stays the dominant image; admin uploads extra photos that
    appear as a thumbnail mini gallery under it (`components/product-gallery.tsx`, client).
  - **Documents**: PDF repository per product, shown as a Downloads section on the page.
  - **Video**: YouTube URL → `youtube-nocookie` embed + "Watch on YouTube" link.
  - **Muscles**: front+back figure with per-region control. `lib/muscle-figure.ts` holds the
    base artwork + 92 indexed highlight regions (`MUSCLE_SHAPES`, grouped into the 15 muscle
    keys). `components/muscle-editor.tsx` (client) is a **click-to-edit figure**: click any
    region to toggle its red highlight, group buttons as shortcuts, reset-to-auto / clear-all.
    Public page renders via `<MuscleMap activeShapes={…}/>` (read-only). Selection is stored
    per product as `muscleShapes: number[]` (region indices) in product-meta; priority is
    explicit selection → legacy `muscles` group list → auto-detect from the "Target muscles"
    text (`lib/muscles.ts`, "thigh"/"legs" map to the full front-thigh set). **Indices in
    `lib/muscle-figure.ts` are stable — never reorder** (saved selections reference them).
    **The figure is the official catalog artwork** (2026-07-20, commit 5659190): vector paths
    extracted from "Catalogs/2025/Catalog SB 2025 _compressed For Email.pdf" (Google Drive
    archive) with PyMuPDF — 71 base paths + 92 red highlight shapes recovered from all 91
    product figures in the catalog (silhouette-anchored extraction, deduped by bbox, visually
    labeled to muscle keys). The generated component is committed; to regenerate, re-run the
    pipeline described here against the catalog PDF (page.get_drawings → normalize to the
    figure box anchored on the two #848e93 body silhouettes ~22×70pt → dedupe red fills
    #e?2?24/#ed1b34 → label → emit TSX). Old WP muscle PNGs (7423_muscles.png style) are gone
    from the web; only 200×200 thumbs remain on the Wayback Machine.
- Storage: `content/product-meta.json` in Blob (`lib/product-meta.ts`); uploads under
  `products-media/<code>/gallery|docs/`. Absent entry = enabled with defaults.
- **`lib/blob-json.ts`**: all JSON-in-blob stores (texts, product overrides, meta, report)
  read/write through this helper — globalThis write-through cache prevents CDN-stale
  read-modify-write lost updates; `unstable_cache(..., revalidate: 300)` self-heals any
  transient bad read. Rapid scripted writes can still race across serverless instances;
  human-paced admin use is safe.

## Data pipeline (products)

Source Excels (same folder tree as the private file):
`Street_Barbell_2026_Recommendation_Ready.xlsx` (primary) and
`Street_Barbell_2026_Master_Database.xlsx`. From these, `data/products.json` (116 products,
prices nulled) was generated; prices went into `STREETBARBELL_PRICING_JSON`.
Plate-load formula strings were converted to numbers (41 products) / null (75).

## Images (added 2026-07-16, commit e78b5c5)

All 116 products show real front renders; hero/gallery/contact use real photos. Everything in
`public/images/` (webp). Source: official Google Drive archive (folder id above; "2D Pictures"
has front/side/top renders per product, "Photos" has 399 installation photos).
Gotcha: anonymous `gdown` hits quota after ~40-50 files; use
`https://drive.google.com/thumbnail?id=X&sz=w1600` instead — full useful quality, no quota.

## How to run / verify / deploy

```
npm run dev          # dev server
npm run verify       # lint + typecheck + security:check + build  ← run before every push
npm run build && node node_modules/next/dist/bin/next start -p 3002   # prod-like local
git push origin main # = production deploy (Vercel auto)
```

Local `.env.local` already contains all five variables. Note for AI-assisted sessions: the
Claude preview-server sandbox blocks outbound network (blob reads hang) — run `next start`
via a normal (unsandboxed) shell to test `/system` locally, and don't hammer the blob URL
with rapid automated fetches (transient "Vercel Security Checkpoint" HTML replaces the JSON).

## Verification checklist (all green 2026-07-17)

- `https://streetbarbell.cz/{en,cs}` + products/lines/gallery/configurations/contact → 200
- `/api/recommend` without a cookie → 200, `priced:false`, all prices null; with a valid
  team cookie → `priced:true`, totals present, per-machine prices still null
- `/api/recommend` (2026 CZK pricing) sample: budget 450,000 CZK, default priorities → top result
  MB 7.47.3 + MB 7.02 + MB 7.71 = 198,000 CZK (62,000 + 38,000 + 98,000), score ≈ 7.0
  (the old EUR sample "MB 7.47.3 + MB 7.71 €5,317" predates the pricelist switch)
- `/system` login → editor; text edit → live in seconds; empty+save → default restored
- `/system/products` → template downloads (116 rows); upload applies/reverts; report shows on page
  (2026-07-17: zero product overrides active — live site runs on built-in data + env pricelist)
- CZ machine names render in English (e.g. `/cs/products/standard-line` → "Vertical Press")
- Czech PDF from configurator renders diacritics

## Commit history (main)

- `af5f1bc` Initial Codex build (deploy was broken: OpenAI-internal registry lockfile)
- `3526336` Fix collapsed line cards, remove dead image host
- `af4497e` Fix deploy blockers: lockfile registry, plate-load data, Czech PDF font
- `e78b5c5` Real product renders + photos (116 products, hero/gallery)
- `679546e` `/system` admin: login + editable site texts (EN/CS), Vercel Blob storage
- `8baa491` Machine names always in original English (both locales)
- `a0f69f4` PROJECT_STATUS.md handover doc
- (2026-07-17) Configurator switched to CZK-native 2026 pricelist (see server-pricing above)
- (2026-07-17) /system/products bulk XLSX import (see its section above)
- `2db5c86` (2026-07-18) /system/catalog: per-product visibility, gallery, PDFs, video, muscle map
- `5659190` (2026-07-20) muscle figure = official catalog vector artwork
- (2026-07-20) per-region click-to-edit muscle editor (muscleShapes indices); fuller thigh auto-detect
- `c40df6f` (2026-07-21) simplified generator per GENERATOR_SPEC.md
- `d58c73b` (2026-07-21) all generator rules consolidated into lib/generator-rules.ts
- `ab3ecc5` (2026-07-21) generator rules batch 1: grouping, de-dup, no-bodyweight, layout
- `a1986c3` (2026-07-22) public configurator + team logins (/system/users, /team-login), rules batch 2
- `3dd4357` (2026-07-22) localized inquiry-email labels
- (2026-07-22) Pro/Plus split, position editor, menu groups (/system/groups), add product (/system/catalog/new)
- `cbd5bd8` (2026-07-22) RVL13-style Website management, per-product line moves, unified menu cards
- `97778d2` (2026-07-22) hero stat: "20 priority points" → ∞ combinations; intro no longer mentions the 20-point matrix
- `658f6f6` (2026-07-22) admin dashboard at /system (stat tiles) + permanent SystemNav top bar
  (RVL13-style big tabs); site-texts editor moved to **/system/texts**
