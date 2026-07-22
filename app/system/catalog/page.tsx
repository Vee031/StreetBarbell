import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SystemNav } from "@/components/system-nav";
import { productLines } from "@/lib/data";
import { getProductName } from "@/lib/data";
import { fetchProductMetaUncached, isEnabled } from "@/lib/product-meta";
import { fetchProductGroupsUncached } from "@/lib/product-groups";
import { getProducts } from "@/lib/products-store";

export const dynamic = "force-dynamic";

export default async function SystemCatalogPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { error } = await searchParams;
  const [allProducts, meta, groupsData] = await Promise.all([getProducts(), fetchProductMetaUncached(), fetchProductGroupsUncached()]);
  const disabledCount = allProducts.filter((product) => !isEnabled(meta, product.code)).length;
  // Combination groups list like lines — their products carry the group as category.
  const groupSections = groupsData.categories.flatMap((category) =>
    category.groups.filter((g) => g.type === "products").map((g) => ({ slug: g.id, title: `${g.labelEn} (${category.labelEn})` })),
  );

  return (
    <>
    <SystemNav active="catalog" />
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <h1>Catalogue</h1>
          <p>
            Overview of all products including admin-created combinations. Every machine has its own card:
            category, position, on/off, photos, PDF documents, YouTube video and the highlighted muscles.
            {" "}{disabledCount > 0 ? `${disabledCount} machine(s) are currently switched off.` : "All machines are currently visible."}
          </p>
        </div>
        <div className="sys-header-actions">
          <Link href="/system/catalog/new" className="button button-red button-small">+ Add product</Link>
        </div>
      </header>

      {error === "storage" ? <p className="sys-banner sys-error">Storage is not reachable — changes cannot be saved right now.</p> : null}

      {[...productLines.map((line) => ({ slug: line.slug, title: line.nameEn })), ...groupSections].map((section) => {
        const sectionProducts = allProducts.filter((product) => product.lineSlug === section.slug);
        if (sectionProducts.length === 0) return null;
        return (
          <section key={section.slug}>
            <h2 className="cat-line-title">{section.title}</h2>
            <div className="cat-grid">
              {sectionProducts.map((product) => {
                const enabled = isEnabled(meta, product.code);
                return (
                  <Link key={product.code} href={`/system/catalog/${product.slug}`} className={enabled ? "cat-card" : "cat-card is-off"}>
                    <span className={enabled ? "cat-badge" : "cat-badge off"}>{enabled ? "On" : "Off"}</span>
                    {product.custom && <span className="cat-badge custom">Custom</span>}
                    <div className="cat-card-image">
                      <Image src={product.image || product.categoryImage} alt={getProductName(product)} fill sizes="220px" />
                    </div>
                    <div className="cat-card-body">
                      <small>{product.code}</small>
                      <strong>{getProductName(product)}</strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
    </>
  );
}
