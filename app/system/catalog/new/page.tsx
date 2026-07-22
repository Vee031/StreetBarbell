import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { productLines } from "@/lib/data";
import { fetchProductGroupsUncached } from "@/lib/product-groups";
import { POSITION_OPTIONS } from "@/lib/products-store";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  code: "Code is required (2–24 characters: letters, numbers, spaces, . / -).",
  name: "The English name is required.",
  line: "Pick a product line.",
  position: "Pick a position from the list.",
  exists: "A product with this code already exists.",
  notimage: "The picture must be an image file (JPG, PNG, WebP…).",
  toobig: "The picture is too large (max 8 MB).",
  storage: "Storage is not reachable — the product was not created.",
};

const inputStyle = { border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem", width: "100%" } as const;
const labelStyle = { display: "grid", gap: 4 } as const;
const smallStyle = { color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", fontSize: ".74rem", letterSpacing: ".06em" } as const;

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { error } = await searchParams;
  const groupsData = await fetchProductGroupsUncached();
  const productGroups = groupsData.categories.flatMap((category) =>
    category.groups.filter((g) => g.type === "products").map((g) => ({ value: `${category.id}/${g.id}`, label: `${category.labelEn} → ${g.labelEn}` })),
  );

  return (
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <Link href="/system/catalog" className="back-link">← Catalogue</Link>
          <h1>Add a product</h1>
          <p>
            Creates a new machine that appears in the chosen product line (and optionally a menu group).
            Photos, documents, video, muscles and on/off are managed afterwards in its catalogue card.
            Admin-created products do not enter the configurator.
          </p>
        </div>
      </header>

      {error && ERRORS[error] ? <p className="sys-banner sys-error">{ERRORS[error]}</p> : null}

      <section className="sys-card" style={{ maxWidth: 720 }}>
        <form action={createProduct} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={labelStyle}>
              <small style={smallStyle}>Code *</small>
              <input type="text" name="newCode" placeholder="e.g. MB 8.01" required style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <small style={smallStyle}>Product line *</small>
              <select name="lineSlug" required style={inputStyle}>
                {productLines.map((line) => <option key={line.slug} value={line.slug}>{line.nameEn}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              <small style={smallStyle}>Name EN *</small>
              <input type="text" name="nameEn" placeholder="Machine name (shown on both languages)" required style={inputStyle} />
            </label>
            <label style={labelStyle}>
              <small style={smallStyle}>Name CZ</small>
              <input type="text" name="nameCs" placeholder="Defaults to the EN name" style={inputStyle} />
            </label>
          </div>
          <label style={labelStyle}>
            <small style={smallStyle}>Description EN</small>
            <textarea name="descriptionEn" rows={3} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            <small style={smallStyle}>Description CZ</small>
            <textarea name="descriptionCs" rows={3} style={inputStyle} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={labelStyle}>
              <small style={smallStyle}>Exercise position</small>
              <select name="position" defaultValue="Unknown" style={inputStyle}>
                {POSITION_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              <small style={smallStyle}>Also show in menu group</small>
              <select name="group" style={inputStyle}>
                <option value="">— none —</option>
                {productGroups.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </label>
          </div>
          <label style={labelStyle}>
            <small style={smallStyle}>Main picture (optional — line photo is used if empty)</small>
            <input type="file" name="image" accept="image/*" />
          </label>
          <div>
            <button type="submit" className="button button-red">Create product</button>
          </div>
        </form>
      </section>
    </div>
  );
}
