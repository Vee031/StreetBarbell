import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, ArrowUp, CornerDownRight, X } from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SystemNav } from "@/components/system-nav";
import { productLines } from "@/lib/data";
import { categoriesLinkToConfigurator, fetchProductGroupsUncached, isActive } from "@/lib/product-groups";
import { getProducts } from "@/lib/products-store";
import { createCategory, createGroup, deleteCategory, deleteGroup, moveCategory, moveGroup, toggleCategoryActive, toggleGroupActive } from "./actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  storage: "Storage is not reachable — the change was not saved.",
  label: "The English label is required.",
  exists: "A category / group with this name already exists.",
  href: "The link must be a site path starting with / (e.g. /configurations).",
};

const inputStyle = { border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem" } as const;

function StatusPill({ active }: { active: boolean }) {
  return <button type="submit" className={active ? "wm-pill on" : "wm-pill off"}>{active ? "Aktivní" : "Neaktivní"}</button>;
}

export default async function WebsiteManagementPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { saved, error } = await searchParams;
  const [data, products] = await Promise.all([fetchProductGroupsUncached(), getProducts()]);
  const byLine = productLines.map((line) => ({ line, products: products.filter((p) => p.lineSlug === line.slug) }));
  const configReplaced = categoriesLinkToConfigurator(data);

  return (
    <>
    <SystemNav active="groups" />
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <h1>Website management — menu &amp; pages</h1>
          <p>
            The main-page menu as a tree. Level 0 = a menu entry, level 1 = an item in its dropdown.
            Built-in parts (Products, Gallery…) are fixed; your categories are fully editable — status,
            order, contents. Products themselves are managed in the <Link href="/system/catalog">Catalogue</Link>.
          </p>
        </div>
      </header>

      {error && ERRORS[error] ? <p className="sys-banner sys-error">{ERRORS[error]}</p> : null}
      {saved ? <p className="sys-banner sys-saved">Saved — the menu updates in a few seconds.</p> : null}

      <details className="wm-add">
        <summary className="button button-red">Přidat / Add menu entry ›</summary>
        <form action={createCategory} className="sys-upload-row" style={{ marginTop: 14 }}>
          <input type="text" name="labelEn" placeholder="Label EN (e.g. Recommended setups)" required style={{ ...inputStyle, minWidth: 240 }} />
          <input type="text" name="labelCs" placeholder="Label CZ (e.g. Doporučené sestavy)" style={{ ...inputStyle, minWidth: 240 }} />
          <button type="submit" className="button button-dark button-small">Create</button>
        </form>
      </details>

      <div className="wm-table">
        <div className="wm-head">
          <span>Název / Name</span>
          <span>Status</span>
          <span>Úroveň</span>
          <span>Akce</span>
        </div>

        {/* Built-in: Products + its lines (read-only structure) */}
        <div className="wm-row level0">
          <span className="wm-name"><strong>Products</strong> <em className="wm-tag">built-in</em></span>
          <span><span className="wm-pill on static">Aktivní</span></span>
          <span className="wm-level">0</span>
          <span className="wm-actions" />
        </div>
        {byLine.map(({ line, products: lineProducts }) => (
          <div className="wm-row level1" key={line.slug}>
            <span className="wm-name"><CornerDownRight size={13} /> {line.nameEn} <small>{lineProducts.length} machines — <Link href="/system/catalog">manage in Catalogue</Link></small></span>
            <span><span className="wm-pill on static">Aktivní</span></span>
            <span className="wm-level">1</span>
            <span className="wm-actions" />
          </div>
        ))}

        {/* Custom categories */}
        {data.categories.map((category, categoryIndex) => (
          <div key={category.id} style={{ display: "contents" }}>
            <div className={isActive(category) ? "wm-row level0" : "wm-row level0 is-off"}>
              <span className="wm-name"><strong>{category.labelEn}</strong> <small>/ {category.labelCs}</small></span>
              <span>
                <form action={toggleCategoryActive}><input type="hidden" name="categoryId" value={category.id} /><StatusPill active={isActive(category)} /></form>
              </span>
              <span className="wm-level">0</span>
              <span className="wm-actions">
                {categoryIndex > 0 && (
                  <form action={moveCategory}><input type="hidden" name="categoryId" value={category.id} /><input type="hidden" name="delta" value="up" /><button type="submit" title="Move up"><ArrowUp size={15} /></button></form>
                )}
                {categoryIndex < data.categories.length - 1 && (
                  <form action={moveCategory}><input type="hidden" name="categoryId" value={category.id} /><input type="hidden" name="delta" value="down" /><button type="submit" title="Move down"><ArrowDown size={15} /></button></form>
                )}
                <form action={deleteCategory}><input type="hidden" name="categoryId" value={category.id} /><button type="submit" title="Delete"><X size={15} /></button></form>
              </span>
            </div>

            {category.groups.map((group, groupIndex) => (
              <div key={group.id} style={{ display: "contents" }}>
                <div className={isActive(group) && isActive(category) ? "wm-row level1" : "wm-row level1 is-off"}>
                  <span className="wm-name">
                    <CornerDownRight size={13} /> {group.labelEn} <small>/ {group.labelCs}</small>
                    {group.type === "link" ? (
                      <small className="wm-meta">link → {group.href}</small>
                    ) : (
                      <small className="wm-meta">
                        {products.filter((p) => p.lineSlug === group.id).length} product(s) · assign in the <Link href="/system/catalog">Catalogue</Link> · <Link href={`/cs/g/${category.id}/${group.id}`} target="_blank" rel="noreferrer">page ↗</Link>
                      </small>
                    )}
                  </span>
                  <span>
                    <form action={toggleGroupActive}><input type="hidden" name="categoryId" value={category.id} /><input type="hidden" name="groupId" value={group.id} /><StatusPill active={isActive(group)} /></form>
                  </span>
                  <span className="wm-level">1</span>
                  <span className="wm-actions">
                    {groupIndex > 0 && (
                      <form action={moveGroup}><input type="hidden" name="categoryId" value={category.id} /><input type="hidden" name="groupId" value={group.id} /><input type="hidden" name="delta" value="up" /><button type="submit" title="Move up"><ArrowUp size={15} /></button></form>
                    )}
                    {groupIndex < category.groups.length - 1 && (
                      <form action={moveGroup}><input type="hidden" name="categoryId" value={category.id} /><input type="hidden" name="groupId" value={group.id} /><input type="hidden" name="delta" value="down" /><button type="submit" title="Move down"><ArrowDown size={15} /></button></form>
                    )}
                    <form action={deleteGroup}><input type="hidden" name="categoryId" value={category.id} /><input type="hidden" name="groupId" value={group.id} /><button type="submit" title="Delete"><X size={15} /></button></form>
                  </span>
                </div>

              </div>
            ))}

            <details className="wm-edit">
              <summary>+ Add an item to “{category.labelEn}”</summary>
              <form action={createGroup} style={{ display: "grid", gap: 10, marginTop: 12, maxWidth: 560 }}>
                <input type="hidden" name="categoryId" value={category.id} />
                <div className="sys-upload-row">
                  <input type="text" name="labelEn" placeholder="Label EN" required style={{ ...inputStyle, minWidth: 200 }} />
                  <input type="text" name="labelCs" placeholder="Label CZ" style={{ ...inputStyle, minWidth: 200 }} />
                </div>
                <label style={{ display: "grid", gap: 4 }}>
                  <small className="sys-note">Type</small>
                  <select name="type" style={{ ...inputStyle, maxWidth: 280 }}>
                    <option value="products">Product group (a page of machines)</option>
                    <option value="link">Link to a page</option>
                  </select>
                </label>
                <input type="text" name="href" placeholder="Link path, e.g. /configurations (link type only)" style={inputStyle} />
                <input type="text" name="subtitleEn" placeholder="Menu-card subtitle EN (link type, e.g. Infinity combinations)" style={inputStyle} />
                <input type="text" name="subtitleCs" placeholder="Menu-card subtitle CZ (link type)" style={inputStyle} />
                <input type="text" name="tooltipEn" placeholder="Hover tooltip EN (optional, link type)" style={inputStyle} />
                <input type="text" name="tooltipCs" placeholder="Hover tooltip CZ (optional, link type)" style={inputStyle} />
                <div><button type="submit" className="button button-red button-small">Add item</button></div>
              </form>
            </details>
          </div>
        ))}

        {/* Built-in tail entries, for the full menu picture */}
        {!configReplaced && (
          <div className="wm-row level0">
            <span className="wm-name"><strong>Recommended configurations</strong> <em className="wm-tag">built-in</em><small className="wm-meta">hides automatically when a category links to /configurations</small></span>
            <span><span className="wm-pill on static">Aktivní</span></span>
            <span className="wm-level">0</span>
            <span className="wm-actions" />
          </div>
        )}
        <div className="wm-row level0">
          <span className="wm-name"><strong>Gallery</strong> <em className="wm-tag">built-in</em></span>
          <span><span className="wm-pill on static">Aktivní</span></span>
          <span className="wm-level">0</span>
          <span className="wm-actions" />
        </div>
        <div className="wm-row level0">
          <span className="wm-name"><strong>Contact</strong> <em className="wm-tag">built-in</em></span>
          <span><span className="wm-pill on static">Aktivní</span></span>
          <span className="wm-level">0</span>
          <span className="wm-actions" />
        </div>
      </div>
    </div>
    </>
  );
}
