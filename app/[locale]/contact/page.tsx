import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = getDictionary(locale);
  return <><section className="page-hero contact-hero"><div className="page-shell"><span className="eyebrow light">Street Barbell / RVL13</span><h1>{d.contact.title}</h1><p>{d.contact.intro}</p></div></section><section className="section page-shell"><ContactForm locale={locale}/></section></>;
}
