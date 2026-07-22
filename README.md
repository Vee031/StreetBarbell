# Street Barbell Web App

Bilingual distributor website and outdoor-gym recommendation tool for **Street Barbell**.

The project is designed for deployment at **streetbarbell.cz** through Vercel and the public GitHub repository `Vee031/StreetBarbell`.

## Included in this first build

- English and Czech routes from the start: `/en` and `/cs`
- Responsive animated homepage
- Product mega-menu with all product lines
- Product-line pages and individual product pages
- 116 normalized products and 232 bilingual product detail routes
- Public recommendation configurator (real prices shown only to signed-in team members)
- Budget, workout-structure, body-focus, sport and position filters
- Exact 20-point priority matrix
- Server-side combination ranking with soft duplication rules
- Sport-sensitive recommendations, including a soccer/lower-body profile
- Multiple meaningfully different recommendation results
- Downloadable PDF setup summary
- Gallery
- Contact/quote page using:
  - `export@rvl13.com`
  - WhatsApp `+420 721 443 652`
- Private commercial pricing kept out of the public repository

## Technology

- Next.js 16 App Router
- React 19
- TypeScript
- Framer Motion
- jsPDF
- Lucide icons
- Vercel-compatible server routes

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The root redirects to `/en`.

The configurator is public; prices appear only after a team member signs in at `/en/team-login` (accounts are managed in `/system/users`).

## Required environment variables

See `PROJECT_STATUS.md` (authoritative) for the full inventory. Create these in `.env.local` for local development and in Vercel for Production:

```text
STREETBARBELL_APP_SECRET=
STREETBARBELL_PRICELIST_JSON=
STREETBARBELL_ADMIN_PASSWORD=
BLOB_READ_WRITE_TOKEN=
```

- `STREETBARBELL_APP_SECRET`: long random secret used to derive the secure session cookies.
- `STREETBARBELL_PRICELIST_JSON`: private product-code-to-CZK-price mapping.
- `STREETBARBELL_ADMIN_PASSWORD`: `/system` admin login.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob store for admin content overrides and team users.

**Never commit `.env.local`, the app secret or private pricing.**

## Vercel deployment

1. Push this repository to GitHub.
2. Open the existing Vercel project **StreetBarbell**.
3. In **Settings → Git**, connect `Vee031/StreetBarbell`.
4. In **Settings → Environment Variables**, add the private variables for Production and Preview.
5. Deploy the `main` branch.
6. In **Settings → Domains**, add:
   - `streetbarbell.cz`
   - optionally `www.streetbarbell.cz`
7. Follow Vercel's displayed DNS records at the domain registrar.
8. Test `/en/configurations` (and price visibility with a team login) before announcing the site.

No custom Build Command is needed. Vercel should detect Next.js automatically.

## GitHub push from an empty repository

From this project folder:

```bash
git init
git add .
git commit -m "Initial Street Barbell web app"
git branch -M main
git remote add origin https://github.com/Vee031/StreetBarbell.git
git push -u origin main
```

GitHub may ask you to authenticate through the browser or GitHub CLI. Do not paste account passwords into source files.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run security:check
npm run build
```

Or run everything:

```bash
npm run verify
```

`security:check` fails if commercial prices appear in the public product JSON or if `.env.local` is not ignored.

## Data model

Public product information lives in:

- `data/products.json`
- `data/lines.json`

The public JSON contains product specifications, classifications, movement patterns, bilingual names/descriptions and recommendation attributes. Its price fields are deliberately `null`.

Private prices are merged into product records only inside the authenticated server recommendation route. The browser never receives the complete price table.

## Recommendation engine

The engine applies:

1. Hard filters: budget, selected price basis, machine count and optional strict position preference.
2. Candidate relevance: body focus, sport/use case, public usability and workout complementarity.
3. Combination metrics: balance, specialization, variety, beginner suitability, accessibility, throughput, space, workout complement and value.
4. The distributor's exact 20-point matrix.
5. Soft penalties for unnecessary movement duplication.
6. Reduced duplication penalties when specialization is explicitly requested.
7. Result-diversity filtering so the returned setups are genuine alternatives.

The recommendation logic is in `lib/recommender.ts` and is intentionally separate from the UI.

## Contact form behavior

Version one uses `mailto:` and WhatsApp links. It does not store form submissions and does not require a database. A server-side email provider can be added later if automatic submission, CRM integration or lead storage is required.

## Asset note

The first build uses selected existing Street Barbell web images through remote URLs. The Dropbox archive remains the source library for production assets, technical sheets, project photos and videos. Before the final public launch, the preferred images should be copied into managed project storage, resized and converted to WebP/AVIF so the website does not depend on old website URLs.

## Recommended next improvements

- Replace remote images with curated optimized Dropbox assets
- Review Czech product-name translations with the Street Barbell team
- Add product search and filters
- Add branded machine images to the generated PDF
- Add a server-side email/CRM workflow
- Add analytics and consent management
- Add an editable admin data pipeline for future price/product updates
