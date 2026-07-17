import { notFound } from "next/navigation";
import { LineCard } from "@/components/line-card";
import { MotionReveal } from "@/components/motion-reveal";
import { productLines } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = await getSiteTexts(locale);
  return <><section className="page-hero compact"><div className="page-shell"><span className="eyebrow light">Street Barbell</span><h1>{d.products.title}</h1><p>{d.products.intro}</p></div></section><section className="section page-shell"><div className="line-grid">{productLines.map((line,index) => <MotionReveal key={line.slug} delay={(index%3)*.05}><LineCard line={line} locale={locale} /></MotionReveal>)}</div></section></>;
}
