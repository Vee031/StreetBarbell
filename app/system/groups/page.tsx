import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProductName, productLines } from "@/lib/data";
import { fetchProductGroupsUncached } from "@/lib/product-groups";
import { getProducts } from "@/lib/products-store";
import { createCategory, createGroup, deleteCategory, deleteGroup, saveGroupProducts } from "./actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  storage: "Storage is not reachable — the change was not saved.",
  label: "The English label is required.",
  exists: "A category / group with this name already exists.",
  href: "The link must be a site path starting with / (e.g. /configurations).",
};

const inputStyle = { border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem" } as const;

export default async function SystemGroupsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { saved, error } = await searchParams;
  const [data, products] = await Promise.all([fetchProductGroupsUncached(), getProducts()]);
  const byLine = productLines.map((line) => ({ line, products: products.filter((p) => p.lineSlug === line.slug) }));

  return (
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <h1>Menu categories &amp; product groups</h1>
          <p>Each category becomes a dropdown in the main menu. A product group is a page listing the machines you assign; a link entry points anywhere on the site (with an optional hover tooltip).</p>
        </div>
        <div className="sys-header-actions">
          <Link href="/system">Site texts</Link>
          <Link href="/system/catalog">Catalogue</Link>
          <Link href="/system/users">Team members</Link>
        </div>
      </header>

      {error && ERRORS[error] ? <p className="sys-banner sys-error">{ERRORS[error]}</p> : null}
      {saved ? <p className="sys-banner sys-saved">Saved — the menu updates in a few seconds.</p> : null}

      <section className="sys-card">
        <div className="sys-card-head">
          <h2>New category</h2>
          <p>Appears as a new dropdown in the menu, on both language versions.</p>
        </div>
        <form action={createCategory} className="sys-upload-row">
          <input type="text" name="labelEn" placeholder="Label EN (e.g. Recommended setups)" required style={{ ...inputStyle, minWidth: 240 }} />
          <input type="text" name="labelCs" placeholder="Label CZ (e.g. Doporučené sestavy)" style={{ ...inputStyle, minWidth: 240 }} />
          <button type="submit" className="button button-red button-small">Create category</button>
        </form>
      </section>

      {data.categories.length === 0 && <p className="sys-note">No categories yet — the menu shows only the built-in items.</p>}

      {data.categories.map((category) => (
        <section className="sys-card" key={category.id}>
          <div className="sys-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
            <div>
              <h2>{category.labelEn} <small style={{ color: "var(--muted)", fontWeight: 600 }}>/ {category.labelCs}</small></h2>
              <p>Menu dropdown with {category.groups.length} item(s).</p>
            </div>
            <form action={deleteCategory}>
              <input type="hidden" name="categoryId" value={category.id} />
              <button type="submit">Delete category</button>
            </form>
          </div>

          {category.groups.map((group) => (
            <div key={group.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: group.type === "products" ? 12 : 0 }}>
                <div>
                  <strong>{group.labelEn} <small style={{ color: "var(--muted)", fontWeight: 600 }}>/ {group.labelCs}</small></strong>
                  {group.type === "link" ? (
                    <p className="sys-note" style={{ margin: "4px 0 0" }}>
                      Link → {group.href}
                      {group.tooltipCs || group.tooltipEn ? <> · tooltip: “{group.tooltipCs || group.tooltipEn}”</> : null}
                    </p>
                  ) : (
                    <p className="sys-note" style={{ margin: "4px 0 0" }}>
                      {(group.productCodes ?? []).length} product(s) · page <Link href={`/cs/g/${category.id}/${group.id}`} target="_blank" rel="noreferrer">/g/{category.id}/{group.id} ↗</Link>
                    </p>
                  )}
                </div>
                <form action={deleteGroup}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="groupId" value={group.id} />
                  <button type="submit">Remove</button>
                </form>
              </div>
              {group.type === "products" && (
                <form action={saveGroupProducts}>
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="groupId" value={group.id} />
                  <select name="codes" multiple size={10} defaultValue={group.productCodes ?? []} style={{ ...inputStyle, width: "100%", marginBottom: 10 }}>
                    {byLine.map(({ line, products: lineProducts }) => (
                      <optgroup key={line.slug} label={line.nameEn}>
                        {lineProducts.map((p) => <option key={p.code} value={p.code}>{p.code} — {getProductName(p)}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <button type="submit" className="button button-dark button-small">Save selection</button>
                    <small className="sys-note">Hold Ctrl (Cmd on Mac) to select multiple machines.</small>
                  </div>
                </form>
              )}
            </div>
          ))}

          <details style={{ marginTop: 6 }}>
            <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: ".9rem" }}>Add an item to “{category.labelEn}”</summary>
            <form action={createGroup} style={{ display: "grid", gap: 10, marginTop: 12, maxWidth: 560 }}>
              <input type="hidden" name="categoryId" value={category.id} />
              <div className="sys-upload-row">
                <input type="text" name="labelEn" placeholder="Label EN" required style={{ ...inputStyle, minWidth: 200 }} />
                <input type="text" name="labelCs" placeholder="Label CZ" style={{ ...inputStyle, minWidth: 200 }} />
              </div>
              <label style={{ display: "grid", gap: 4 }}>
                <small className="sys-note">Type</small>
                <select name="type" style={{ ...inputStyle, maxWidth: 260 }}>
                  <option value="products">Product group (a page of machines)</option>
                  <option value="link">Link to a page</option>
                </select>
              </label>
              <input type="text" name="href" placeholder="Link path, e.g. /configurations (link type only)" style={inputStyle} />
              <input type="text" name="tooltipEn" placeholder="Hover tooltip EN (optional, link type)" style={inputStyle} />
              <input type="text" name="tooltipCs" placeholder="Hover tooltip CZ (optional, link type)" style={inputStyle} />
              <div><button type="submit" className="button button-red button-small">Add item</button></div>
            </form>
          </details>
        </section>
      ))}
    </div>
  );
}
