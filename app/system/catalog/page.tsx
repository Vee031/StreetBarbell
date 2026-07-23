import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { CatalogOrderGrid } from "@/components/catalog-order-grid";
import { SystemNav } from "@/components/system-nav";
import { productLines } from "@/lib/data";
import { getProductName } from "@/lib/data";
import { fetchProductMetaUncached, isEnabled } from "@/lib/product-meta";
import { fetchProductGroupsUncached } from "@/lib/product-groups";
import { getProducts } from "@/lib/products-store";

export const dynamic = "force-dynamic";

export default async function SystemCatalogPage({ searchParams }: { searchParams: Promise<{ error?: string; ordered?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { error, ordered } = await searchParams;
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
      {ordered ? <p className="sys-banner sys-saved">Order saved — the website now shows this sequence.</p> : null}

      {[...productLines.map((line) => ({ slug: line.slug, title: line.nameEn })), ...groupSections].map((section) => {
        const sectionProducts = allProducts.filter((product) => product.lineSlug === section.slug);
        if (sectionProducts.length === 0) return null;
        return (
          <section key={section.slug}>
            <h2 className="cat-line-title">{section.title}</h2>
            <CatalogOrderGrid
              category={section.slug}
              items={sectionProducts.map((product) => ({
                code: product.code,
                slug: product.slug,
                name: getProductName(product),
                image: product.image || product.categoryImage,
                enabled: isEnabled(meta, product.code),
                custom: product.custom,
              }))}
            />
          </section>
        );
      })}
    </div>
    </>
  );
}
