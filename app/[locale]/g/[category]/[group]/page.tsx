import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { filterEnabled } from "@/lib/product-meta";
import { loadProductGroups } from "@/lib/product-groups";
import { getProducts } from "@/lib/products-store";
import { countNoun, isLocale, nounMachines, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";

// Groups are created by the admin at runtime — always rendered on demand.
export const dynamic = "force-dynamic";

export default async function ProductGroupPage({ params }: { params: Promise<{ locale: string; category: string; group: string }> }) {
  const { locale: rawLocale, category: categoryId, group: groupId } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const cs = locale === "cs";
  const [d, groupsData] = await Promise.all([getSiteTexts(locale), loadProductGroups()]);
  const category = groupsData.categories.find((c) => c.id === categoryId);
  const group = category?.groups.find((g) => g.id === groupId && g.type === "products");
  if (!category || !group) notFound();

  const codes = group.productCodes ?? [];
  const all = await filterEnabled(await getProducts());
  const byCode = new Map(all.map((p) => [p.code, p]));
  const groupProducts = codes.map((code) => byCode.get(code)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const categoryLabel = cs ? category.labelCs || category.labelEn : category.labelEn;
  const groupLabel = cs ? group.labelCs || group.labelEn : group.labelEn;
  const heroImage = groupProducts[0]?.categoryImage || "/images/photos/park-city.webp";

  return <>
    <section className="page-hero product-line-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(8,11,16,.92),rgba(8,11,16,.45)),url('${heroImage}')` }}>
      <div className="page-shell">
        <Link className="back-link" href={`/${locale}`}><ArrowLeft size={16} />{d.products.back}</Link>
        <span className="eyebrow light">{categoryLabel}</span>
        <h1>{groupLabel}</h1>
        <p>{groupProducts.length} {countNoun(groupProducts.length, locale, nounMachines)}</p>
      </div>
    </section>
    <section className="section page-shell">
      {groupProducts.length ? (
        <div className="product-grid">{groupProducts.map((product) => <ProductCard key={product.code} product={product} locale={locale} t={d.products} />)}</div>
      ) : (
        <p>{d.products.noProducts}</p>
      )}
    </section>
  </>;
}
