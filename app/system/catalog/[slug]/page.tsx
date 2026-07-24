import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SystemNav } from "@/components/system-nav";
import { getProductName, productLines } from "@/lib/data";
import { MuscleEditor } from "@/components/muscle-editor";
import { detectMuscles } from "@/lib/muscles";
import { shapeIndicesForKeys } from "@/lib/muscle-figure";
import { effectiveMuscleShapes, fetchProductMetaUncached, isEnabled } from "@/lib/product-meta";
import { fetchProductGroupsUncached } from "@/lib/product-groups";
import { fetchCustomProductsUncached, getProducts, POSITION_OPTIONS } from "@/lib/products-store";
import { addComponentProduct, deleteCustomProduct, deleteDocument, deleteGalleryImage, makeMainImage, removeComponentProduct, saveIdentity, saveLine, savePosition, saveTexts, saveVideoAndMuscles, toggleProduct, uploadDocument, uploadGalleryImages } from "../actions";

const fieldLabel = { color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: ".74rem", letterSpacing: ".06em" } as const;
const fieldInput = { border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem", width: "100%", fontFamily: "inherit" } as const;

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  storage: "Storage is not reachable — the change was not saved.",
  youtube: "That does not look like a YouTube link (expected youtube.com/watch?v=… or youtu.be/…).",
  nofile: "No file was selected.",
  notimage: "Gallery uploads must be images (JPG, PNG, WebP…).",
  notpdf: "Documents must be PDF files.",
  toobig: "The file is too large (images max 8 MB, PDFs max 25 MB).",
  code: "Code must be 2–24 characters: letters, numbers, spaces, . / -",
  name: "The English name is required.",
  exists: "A product with this code already exists.",
};

export default async function CatalogProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { slug } = await params;
  const { saved, error } = await searchParams;
  const [allProducts, metaMap, groupsData, customRecords] = await Promise.all([getProducts(), fetchProductMetaUncached(), fetchProductGroupsUncached(), fetchCustomProductsUncached()]);
  const product = allProducts.find((p) => p.slug === slug);
  if (!product) notFound();
  // Custom products: does the record carry its OWN main picture, or is the shown
  // image just the line/stock fallback?
  const hasOwnMainImage = product.custom ? Boolean(customRecords[product.code]?.image) : true;
  // Combination groups behave exactly like product lines — one dropdown for both.
  const groupOptions = groupsData.categories.flatMap((category) =>
    category.groups.filter((g) => g.type === "products").map((g) => ({ id: g.id, label: `${g.labelEn} (${category.labelEn})` })),
  );
  const meta = metaMap[product.code] ?? {};
  const enabled = isEnabled(metaMap, product.code);
  const name = getProductName(product);
  const initialShapes = effectiveMuscleShapes(product, meta);
  const autoShapes = shapeIndicesForKeys(detectMuscles(product.muscles));
  const componentCodes = meta.components ?? [];
  const componentProducts = componentCodes.map((c) => allProducts.find((p) => p.code === c)).filter((p) => p !== undefined);
  const availableComponents = allProducts.filter((p) => p.code !== product.code && !componentCodes.includes(p.code)).sort((a, b) => a.code.localeCompare(b.code));

  return (
    <>
    <SystemNav active="catalog" />
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <Link href="/system/catalog" className="back-link">← Catalogue</Link>
          <h1>{product.code} — {name}</h1>
          <p>{product.line} · <Link href={`/en/products/${product.lineSlug}/${product.slug}`} target="_blank" rel="noreferrer">Open public page ↗</Link></p>
        </div>
        <div className="sys-header-actions">
          <form action={toggleProduct}>
            <input type="hidden" name="code" value={product.code} />
            <input type="hidden" name="enable" value={enabled ? "false" : "true"} />
            <button type="submit" className={enabled ? "button button-dark button-small" : "button button-red button-small"}>
              {enabled ? "Switch off (hide from site)" : "Switch on (show on site)"}
            </button>
          </form>
          {product.custom && (
            <form action={deleteCustomProduct}>
              <input type="hidden" name="code" value={product.code} />
              <button type="submit" className="button button-small" style={{ border: "1px solid var(--red)", color: "var(--red)", background: "transparent" }}>
                Delete product
              </button>
            </form>
          )}
        </div>
      </header>

      {saved ? <p className="sys-banner sys-saved">Saved — live in a few seconds.</p> : null}
      {error && ERROR_MESSAGES[error] ? <p className="sys-banner sys-error">{ERROR_MESSAGES[error]}</p> : null}
      {!enabled ? <p className="sys-banner sys-error">This machine is switched OFF — hidden from the website, product lists and the configurator.</p> : null}

      <div className="cat-editor-grid">
        <div>
          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Pictures</h2>
              <p>
                {product.custom
                  ? "The first photo you upload becomes the main picture; use “Make main” to switch it anytime. Other photos show in the mini gallery."
                  : "The official render is always the dominant picture. Uploaded photos appear in the mini gallery under it."}
              </p>
            </div>
            <div className="cat-media-grid">
              <div className="cat-media-item">
                <div className="thumb"><Image src={product.image || product.categoryImage} alt={name} fill sizes="130px" /></div>
                <small>{product.custom ? (hasOwnMainImage ? "Main picture" : "Stock photo — upload to replace") : "Main render"}</small>
              </div>
              {(meta.gallery ?? []).map((url) => (
                <div className="cat-media-item" key={url}>
                  <div className="thumb"><Image src={url} alt="" fill sizes="130px" /></div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    {product.custom && (
                      <form action={makeMainImage}>
                        <input type="hidden" name="code" value={product.code} />
                        <input type="hidden" name="url" value={url} />
                        <button type="submit">Make main</button>
                      </form>
                    )}
                    <form action={deleteGalleryImage}>
                      <input type="hidden" name="code" value={product.code} />
                      <input type="hidden" name="url" value={url} />
                      <button type="submit">Remove</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            <form action={uploadGalleryImages} className="sys-upload-row" style={{ marginTop: 16 }}>
              <input type="hidden" name="code" value={product.code} />
              <input type="file" name="images" accept="image/*" multiple required />
              <button type="submit" className="button button-red button-small">Upload photos</button>
            </form>
          </section>

          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Product texts</h2>
              <p>The wording on the product page. Empty a field and save to return to the original text. Movement patterns are separated with a semicolon.</p>
            </div>
            <form action={saveTexts} style={{ display: "grid", gap: 12 }}>
              <input type="hidden" name="code" value={product.code} />
              <label style={{ display: "grid", gap: 4 }}>
                <small style={fieldLabel}>Description EN</small>
                <textarea name="descriptionEn" rows={4} defaultValue={product.descriptionEn} style={fieldInput} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <small style={fieldLabel}>Description CZ</small>
                <textarea name="descriptionCs" rows={4} defaultValue={product.descriptionCs} style={fieldInput} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <small style={fieldLabel}>Target muscles (drives the auto muscle figure)</small>
                <input type="text" name="muscles" defaultValue={product.muscles} style={fieldInput} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <small style={fieldLabel}>Movement patterns (semicolon-separated)</small>
                <input type="text" name="movementPatterns" defaultValue={product.movementPatterns} style={fieldInput} />
              </label>
              <div><button type="submit" className="button button-red button-small">Save texts</button></div>
            </form>
          </section>

          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Documents</h2>
              <p>PDFs shown as downloads on the product page (datasheets, assembly manuals, certificates…).</p>
            </div>
            {(meta.documents ?? []).length > 0 ? (
              <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                {(meta.documents ?? []).map((doc) => (
                  <div className="cat-doc-row" key={doc.url}>
                    <a href={doc.url} target="_blank" rel="noreferrer">{doc.name}</a>
                    <form action={deleteDocument}>
                      <input type="hidden" name="code" value={product.code} />
                      <input type="hidden" name="url" value={doc.url} />
                      <button type="submit">Remove</button>
                    </form>
                  </div>
                ))}
              </div>
            ) : <p className="sys-note">No documents yet.</p>}
            <form action={uploadDocument} className="sys-upload-row" style={{ marginTop: 10 }}>
              <input type="hidden" name="code" value={product.code} />
              <input type="file" name="file" accept=".pdf,application/pdf" required />
              <input type="text" name="name" placeholder="Display name (optional)" style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".9rem" }} />
              <button type="submit" className="button button-red button-small">Upload PDF</button>
            </form>
          </section>
        </div>

        <div>
          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Code &amp; name</h2>
              <p>
                {product.custom
                  ? "Both are editable for admin-created products. Changing them also changes the product's web address."
                  : "The code identifies this built-in machine and cannot change; the display names can. Empty a name and save to return to the original."}
              </p>
            </div>
            <form action={saveIdentity} style={{ display: "grid", gap: 10 }}>
              <input type="hidden" name="code" value={product.code} />
              <label style={{ display: "grid", gap: 4 }}>
                <small style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: ".74rem", letterSpacing: ".06em" }}>Code</small>
                {product.custom
                  ? <input type="text" name="newCode" defaultValue={product.code} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem" }} />
                  : <input type="text" value={product.code} disabled style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "#f3f4f6", fontSize: ".92rem", color: "#8a8f98" }} />}
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <small style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: ".74rem", letterSpacing: ".06em" }}>Name EN (shown on both languages)</small>
                <input type="text" name="nameEn" defaultValue={product.nameEn} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem" }} />
              </label>
              <label style={{ display: "grid", gap: 4 }}>
                <small style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: ".74rem", letterSpacing: ".06em" }}>Name CZ</small>
                <input type="text" name="nameCs" defaultValue={product.nameCs} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem" }} />
              </label>
              <div><button type="submit" className="button button-red button-small">Save code &amp; name</button></div>
            </form>
          </section>

          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Category (product line)</h2>
              <p>The line or combination group this product belongs to — currently <strong>{product.line}</strong>. Changing it moves the product&apos;s page and listings.</p>
            </div>
            <form action={saveLine} className="sys-upload-row">
              <input type="hidden" name="code" value={product.code} />
              <select name="lineSlug" defaultValue={product.lineSlug} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem", minWidth: 220 }}>
                <optgroup label="Product lines">
                  {productLines.map((line) => <option key={line.slug} value={line.slug}>{line.nameEn}</option>)}
                </optgroup>
                {groupOptions.length > 0 && (
                  <optgroup label="Combination groups">
                    {groupOptions.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                  </optgroup>
                )}
              </select>
              <button type="submit" className="button button-red button-small">Save category</button>
            </form>
          </section>

          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Component machines</h2>
              <p>For a combination like a recommended setup: which individual machines is it built from? Pick one, save, then repeat for the next — they show as linked products on the public page.</p>
            </div>
            {componentProducts.length > 0 ? (
              <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                {componentProducts.map((c) => (
                  <div className="cat-doc-row" key={c.code}>
                    <Link href={`/system/catalog/${c.slug}`}>{c.code} — {getProductName(c)}</Link>
                    <form action={removeComponentProduct}>
                      <input type="hidden" name="code" value={product.code} />
                      <input type="hidden" name="componentCode" value={c.code} />
                      <button type="submit">Remove</button>
                    </form>
                  </div>
                ))}
              </div>
            ) : <p className="sys-note">No component machines added yet.</p>}
            {availableComponents.length > 0 && (
              <form action={addComponentProduct} style={{ display: "grid", gap: 10 }}>
                <input type="hidden" name="code" value={product.code} />
                <label style={{ display: "grid", gap: 4 }}>
                  <small style={fieldLabel}>Add a machine</small>
                  <select name="componentCode" size={8} style={{ ...fieldInput, height: "auto" }} required>
                    {availableComponents.map((p) => <option key={p.code} value={p.code}>{p.code} — {getProductName(p)} · {p.line}</option>)}
                  </select>
                </label>
                <div><button type="submit" className="button button-red button-small">Add machine</button></div>
              </form>
            )}
          </section>

          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Exercise position</h2>
              <p>How the machine is used (seated / standing / …). Shown on the product page and used by the configurator&apos;s position preference.</p>
            </div>
            <form action={savePosition} className="sys-upload-row">
              <input type="hidden" name="code" value={product.code} />
              <select name="position" defaultValue={product.position} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem", minWidth: 220 }}>
                {POSITION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                {!POSITION_OPTIONS.includes(product.position) && <option value={product.position}>{product.position}</option>}
              </select>
              <button type="submit" className="button button-red button-small">Save position</button>
            </form>
          </section>

          <section className="sys-card">
            <div className="sys-card-head">
              <h2>Video &amp; muscles</h2>
              <p>YouTube link from the Street Barbell channel, and the muscles highlighted on the figure. Pre-selected from the product data — adjust freely.</p>
            </div>
            <form action={saveVideoAndMuscles}>
              <input type="hidden" name="code" value={product.code} />
              <label style={{ display: "grid", gap: 4, marginBottom: 6 }}>
                <small style={{ color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: ".74rem", letterSpacing: ".06em" }}>YouTube URL</small>
                <input
                  type="url"
                  name="youtubeUrl"
                  defaultValue={meta.youtubeUrl ?? ""}
                  placeholder="https://www.youtube.com/watch?v=…"
                  style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem", width: "100%" }}
                />
              </label>
              <MuscleEditor initial={initialShapes} autoDetected={autoShapes} />
              <button type="submit" className="button button-red button-small">Save video &amp; muscles</button>
            </form>
          </section>
        </div>
      </div>
    </div>
    </>
  );
}
