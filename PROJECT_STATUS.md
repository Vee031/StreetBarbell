# PROJECT_STATUS — streetbarbell.cz

> **Read this first in any follow-up session.** It is the authoritative status doc for the
> Street Barbell web app, written so the project can be picked up (or rebuilt) from scratch.
> Last checkpoint: **2026-07-17**. It supersedes the older
> `STREETBARBELL_CODEX_HANDOVER_COMPLETE.md` (one folder tree up, kept for history).

## Where we left off (2026-07-17, end of day)

Everything requested so far is **built, deployed and verified live**. No half-finished work.
Shipped today: `/system` admin (login + site-text editor), English machine names on /cs,
configurator switched to the CZK 2026 pricelist, and `/system/products` bulk XLSX import.

**Next session:** Vojta said "I would like to change a couple things about the recommended
configurations generator" — the pricelist switch and the bulk product import were the first
two; ask what else he wants changed on the configurator.

Open follow-ups (nice-to-haves, none urgent):

1. Distributor code is still the temporary `SB-8C7EFF74` — changing it = swap the
   `STREETBARBELL_DISTRIBUTOR_CODE` env var in Vercel (no redeploy needed for env swap +
   redeploy button, or push any commit). Consider per-distributor codes later.
2. More gallery photos can be curated from the Google Drive "Photos" folder (399 available,
   folder id `1FtMcSEhwRMt3VyEzMbJvuxRuTa5RSyBQ`).
3. `/system` login has no rate-limiting (fine for single-admin; add lockout if ever needed).

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
| `STREETBARBELL_DISTRIBUTOR_CODE` | Unlock code for the configurator (`/api/access`) |
| `STREETBARBELL_APP_SECRET` | HMAC secret for both session cookies (distributor + admin) |
| `STREETBARBELL_PRICELIST_JSON` | **Active configurator pricing** — 2026 pricelist, one CZK price (excl. VAT) per code |
| `STREETBARBELL_PRICING_JSON` | Legacy 6-variant EUR distributor prices — no longer read by code, kept as the source for regenerating the pricelist fallback |
| `STREETBARBELL_ADMIN_PASSWORD` | Login for the `/system` text editor |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store `streetbarbell-content` (auto-added by store link) |

Gotcha: adding env values via PowerShell piping appends `\r` that Vercel keeps. Use
`cmd /c "npx vercel env add NAME production < file"` with a file that has **no trailing newline**.

## Architecture map

- `app/[locale]/…` — public pages (en/cs): home, products, products/[line], products/[line]/[slug],
  configurations (configurator), gallery, contact. All SSG via `generateStaticParams`.
- `app/api/access` — distributor unlock → sets HMAC cookie. `app/api/recommend` — scored
  recommendations with prices (requires the cookie).
- `app/system` — **admin text editor** (see below). `app/system/login` — password login.
- `lib/i18n.ts` — the full EN/CS dictionary of site texts (single source of default wording,
  including footer/menu/benefit/gallery-filter texts) + Czech plural helper `countNoun`.
- `lib/site-texts.ts` — `getSiteTexts(locale)`: merges admin overrides (Vercel Blob JSON at
  `content/site-texts.json`) over the dictionary; `unstable_cache` with tag `site-texts`;
  blob reads are timeboxed (5s) and cache-busted with `?v=<uploadedAt>`.
- `lib/admin-auth.ts` / `lib/server-auth.ts` — same pattern twice: HMAC(secret, message) as a
  cookie value, timing-safe compares. Admin cookie `streetbarbell_admin`, distributor cookie
  `streetbarbell_distributor`.
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
  `lib/recommender.ts` — scoring, budget filtering in CZK. `lib/pdf-font.ts` — subsetted DejaVu Sans (Czech diacritics in PDF).
- `components/` — header (client; receives texts as prop `d`), footer, product-card (takes
  `t={d.products}`), line-card, configurator (client), contact-form, motion-reveal.
- `scripts/check-public-data.mjs` — CI guard: public products.json must contain no prices.

## /system admin (added 2026-07-17, commit 679546e)

- `streetbarbell.cz/system` — password login (30-day httpOnly cookie), noindex.
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
- `/api/access` with the current distributor code → `{"authenticated":true}`
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
