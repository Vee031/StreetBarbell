import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { dictionaries } from "@/lib/i18n";
import { fetchOverridesUncached, type SectionKey } from "@/lib/site-texts";
import { saveSection } from "./actions";
import { logout } from "./login/actions";

export const dynamic = "force-dynamic";

const SECTION_META: Record<SectionKey, { title: string; hint: string }> = {
  nav: { title: "Navigation & menu", hint: "Header links, the products mega-menu and the quote button." },
  home: { title: "Homepage", hint: "Hero banner, stats, product-line intro, configurator promo, benefits and the contact strip." },
  products: { title: "Product pages", hint: "Catalogue, line pages and product-detail labels." },
  config: { title: "Configurator page", hint: "Heading of the recommended-configurations tool." },
  gallery: { title: "Gallery page", hint: "Gallery heading, intro and filter buttons." },
  contact: { title: "Contact page", hint: "Contact & quote request heading." },
  common: { title: "Common labels", hint: "Small labels reused across the site." },
  footer: { title: "Footer", hint: "Footer description and column titles." },
};

function labelFor(key: string) {
  const words = key.replace(/([A-Z])/g, " $1").replace(/([0-9]+)/g, " $1 ").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function SystemPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { saved, error } = await searchParams;
  const storageReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const overrides = storageReady ? await fetchOverridesUncached() : {};
  const sections = Object.keys(dictionaries.en) as SectionKey[];

  return (
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <h1>Site texts</h1>
          <p>Edit the wording on streetbarbell.cz. Empty a field and save to return to the original text.</p>
        </div>
        <div className="sys-header-actions">
          <Link href="/system/catalog">Catalogue →</Link>
          <Link href="/system/products">Products import →</Link>
          <Link href="/en" target="_blank" rel="noreferrer">Open website ↗</Link>
          <form action={logout}><button type="submit">Sign out</button></form>
        </div>
      </header>

      {!storageReady ? (
        <p className="sys-banner sys-error">Text storage is not configured (missing BLOB_READ_WRITE_TOKEN) — changes cannot be saved yet.</p>
      ) : null}
      {error === "storage" ? <p className="sys-banner sys-error">Saving failed: text storage is not configured.</p> : null}
      {saved && SECTION_META[saved as SectionKey] ? (
        <p className="sys-banner sys-saved">Saved — “{SECTION_META[saved as SectionKey].title}” is now live. It can take a few seconds to appear on the site.</p>
      ) : null}

      {sections.map((section) => {
        const enDefaults = dictionaries.en[section] as Record<string, string>;
        const csDefaults = dictionaries.cs[section] as Record<string, string>;
        return (
          <section key={section} className="sys-card" id={section}>
            <div className="sys-card-head">
              <h2>{SECTION_META[section].title}</h2>
              <p>{SECTION_META[section].hint}</p>
            </div>
            <form action={saveSection}>
              <input type="hidden" name="section" value={section} />
              {Object.keys(enDefaults).map((key) => {
                const enOverride = overrides.en?.[section]?.[key];
                const csOverride = overrides.cs?.[section]?.[key];
                const long = enDefaults[key].length > 70 || csDefaults[key].length > 70;
                return (
                  <div key={key} className="sys-field">
                    <span className="sys-field-label">{labelFor(key)}{enOverride || csOverride ? <em> · edited</em> : null}</span>
                    <div className="sys-field-grid">
                      <label>
                        <small>English</small>
                        {long
                          ? <textarea name={`en.${key}`} rows={3} defaultValue={enOverride ?? enDefaults[key]} placeholder={enDefaults[key]} />
                          : <input name={`en.${key}`} defaultValue={enOverride ?? enDefaults[key]} placeholder={enDefaults[key]} />}
                      </label>
                      <label>
                        <small>Czech</small>
                        {long
                          ? <textarea name={`cs.${key}`} rows={3} defaultValue={csOverride ?? csDefaults[key]} placeholder={csDefaults[key]} />
                          : <input name={`cs.${key}`} defaultValue={csOverride ?? csDefaults[key]} placeholder={csDefaults[key]} />}
                      </label>
                    </div>
                  </div>
                );
              })}
              <button type="submit" className="button button-red button-small" disabled={!storageReady}>Save {SECTION_META[section].title.toLowerCase()}</button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
