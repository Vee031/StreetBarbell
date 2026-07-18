import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, FileText, Mail, Play } from "lucide-react";
import { MuscleMap } from "@/components/muscle-map";
import { ProductGallery } from "@/components/product-gallery";
import { getProductDescription, getProductName, products } from "@/lib/data";
import { effectiveMuscles, isEnabled, loadProductMeta, youtubeVideoId } from "@/lib/product-meta";
import { getMergedProduct } from "@/lib/products-store";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";

export function generateStaticParams() {
  return products.map((product) => ({ line: product.lineSlug, slug: product.slug }));
}

function valueOrDash(value: unknown) { return value === null || value === undefined || value === "" ? "—" : String(value); }

export default async function ProductDetailPage({ params }: { params: Promise<{ locale: string; line: string; slug: string }> }) {
  const { locale: rawLocale, line, slug } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = await getSiteTexts(locale); const cs = locale === "cs";
  const product = await getMergedProduct(line, slug); if (!product) notFound();
  const metaMap = await loadProductMeta();
  if (!isEnabled(metaMap, product.code)) notFound();
  const meta = metaMap[product.code];
  const name = getProductName(product);
  const mailBody = `${cs ? "Mám zájem o produkt" : "I am interested in"}: ${product.code} — ${name}`;
  const galleryImages = [product.image || product.categoryImage, ...(meta?.gallery ?? [])];
  const documents = meta?.documents ?? [];
  const videoId = youtubeVideoId(meta?.youtubeUrl);
  const muscles = effectiveMuscles(product, meta);
  return <>
    <section className="product-detail-hero">
      <div className="page-shell product-detail-grid">
        <div className="product-detail-copy">
          <Link className="back-link dark" href={`/${locale}/products/${line}`}><ArrowLeft size={16}/>{cs ? product.lineCs : product.line}</Link>
          <span className="eyebrow">{product.code}</span><h1>{name}</h1><p>{getProductDescription(product, locale)}</p>
          <div className="product-tags"><span>{product.bodyFocus}</span><span>{product.position}</span>{product.workoutComplement === "High" && <span>{cs ? "Výborně doplňuje workout" : "Strong workout complement"}</span>}</div>
          <div className="product-price-row"><div><small>{d.products.from}</small><strong>{cs ? "Na vyžádání" : "On request"}</strong><span>{d.products.exVat}</span></div><a className="button button-red" href={`mailto:export@rvl13.com?subject=${encodeURIComponent(`${product.code} ${name}`)}&body=${encodeURIComponent(mailBody)}`}><Mail size={18}/>{d.products.quoteProduct}</a></div>
        </div>
        <ProductGallery images={galleryImages} alt={name} code={product.code} />
      </div>
    </section>

    <section className="section page-shell detail-sections">
      <div className="detail-main">
        <section><span className="eyebrow">{d.products.specification}</span><h2>{cs ? "Data pro projektování a nabídku" : "Data for project planning and quotations"}</h2><div className="spec-grid">
          <div><small>{d.products.dimensions}</small><strong>{valueOrDash(product.dimensions.length)} × {valueOrDash(product.dimensions.width)} × {valueOrDash(product.dimensions.height)} mm</strong></div>
          <div><small>{d.products.weight}</small><strong>{product.weightKg ? `${product.weightKg} kg` : "—"}</strong></div>
          <div><small>{d.products.load}</small><strong>{product.loadSpecification || (product.totalPlateLoadKg ? `${product.totalPlateLoadKg} kg` : "—")}</strong></div>
          <div><small>{d.products.position}</small><strong>{product.position}</strong></div>
          <div><small>{cs ? "Přibližná plocha" : "Approx. footprint"}</small><strong>{product.footprint ? `${product.footprint.toFixed(2)} m²` : "—"}</strong></div>
          <div><small>{cs ? "Současní uživatelé" : "Simultaneous users"}</small><strong>{product.simultaneousUsers}</strong></div>
        </div></section>
        <section><span className="eyebrow">{d.products.muscles}</span><h2>{product.muscles || (cs ? "Více svalových skupin" : "Multiple muscle groups")}</h2>{muscles.length > 0 && <MuscleMap highlighted={muscles} className="muscle-map" />}<div className="movement-list">{product.movementPatterns.split(";").filter(Boolean).map((pattern) => <span key={pattern}><Check size={17}/>{pattern.trim()}</span>)}</div></section>
        {videoId && <section><span className="eyebrow">{cs ? "Video" : "Video"}</span><h2>{cs ? "Stroj v akci" : "See it in action"}</h2><div className="product-video"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={`${name} — video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div><a className="text-link" href={meta?.youtubeUrl} target="_blank" rel="noreferrer"><Play size={16}/> {cs ? "Otevřít na YouTube" : "Watch on YouTube"}</a></section>}
        {documents.length > 0 && <section><span className="eyebrow">{cs ? "Dokumenty" : "Documents"}</span><h2>{cs ? "Ke stažení" : "Downloads"}</h2><div className="document-list">{documents.map((doc) => <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer"><FileText size={18}/><span>{doc.name}</span></a>)}</div></section>}
        <section><span className="eyebrow">{d.products.materials}</span><div className="material-table"><div><span>{d.products.frame}</span><strong>{product.materials.frame || "—"}</strong></div><div><span>{d.products.rails}</span><strong>{product.materials.rails || "—"}</strong></div><div><span>{d.products.smallParts}</span><strong>{product.materials.smallParts || "—"}</strong></div><div><span>{d.products.finish}</span><strong>{product.materials.finish || "—"}</strong></div></div></section>
      </div>
      <aside className="detail-aside"><span className="eyebrow">{cs ? "Doporučovací data" : "Recommendation profile"}</span><h3>{cs ? "Jak stroj funguje v sestavě" : "How it performs in a setup"}</h3>{[[cs?"Variabilita":"Variety",product.scores.variety],[cs?"Pro veřejnost":"Public usability",product.scores.beginner],[cs?"Přístupnost":"Accessibility",product.scores.accessibility],[cs?"Úspora prostoru":"Space efficiency",product.scores.space],[cs?"Doplnění workoutu":"Workout complement",product.scores.complement]].map(([label,score]) => <div className="aside-score" key={String(label)}><span>{label}</span><i><b style={{width:`${Number(score)*10}%`}}/></i><strong>{score}/10</strong></div>)}<Link className="button button-dark" href={`/${locale}/configurations`}>{cs ? "Použít v konfigurátoru" : "Use in configurator"}<ArrowUpRight size={18}/></Link>{product.websiteUrl && <a className="source-link" href={product.websiteUrl} target="_blank" rel="noreferrer">{d.products.openSource}<ArrowUpRight size={15}/></a>}</aside>
    </section>
  </>;
}
