import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { productLines } from "@/lib/data";
import { filterEnabled } from "@/lib/product-meta";
import { getMergedProductsByLine } from "@/lib/products-store";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";

export default async function ProductLinePage({ params }: { params: Promise<{ locale: string; line: string }> }) {
  const { locale: rawLocale, line } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = await getSiteTexts(locale);
  const productLine = productLines.find((item) => item.slug === line); if (!productLine) notFound();
  const lineProducts = await filterEnabled(await getMergedProductsByLine(line));
  return <><section className="page-hero product-line-hero" style={{ backgroundImage: `linear-gradient(90deg,rgba(8,11,16,.92),rgba(8,11,16,.45)),url('${productLine.image}')` }}><div className="page-shell"><Link className="back-link" href={`/${locale}/products`}><ArrowLeft size={16}/>{d.products.back}</Link><span className="eyebrow light">{d.nav.products}</span><h1>{locale === "cs" ? productLine.nameCs : productLine.nameEn}</h1><p>{lineProducts.length} {d.products.machines}</p></div></section><section className="section page-shell">{lineProducts.length ? <div className="product-grid">{lineProducts.map((product) => <ProductCard key={product.code} product={product} locale={locale} t={d.products}/>)}</div> : <p>{d.products.noProducts}</p>}</section></>;
}
