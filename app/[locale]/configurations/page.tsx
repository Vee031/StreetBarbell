import { notFound } from "next/navigation";
import { Configurator } from "@/components/configurator";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default async function ConfigurationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = getDictionary(locale);
  return <><section className="page-hero config-hero"><div className="page-shell"><span className="eyebrow light">Street Barbell Intelligence</span><h1>{d.config.title}</h1><p>{d.config.intro}</p></div></section><section className="section page-shell config-section"><Configurator locale={locale}/></section></>;
}
