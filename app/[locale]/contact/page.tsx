import { notFound } from "next/navigation";
import { ContactForm } from "@/components/contact-form";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";

// Dynamic: reads ?sent / ?error / ?msg (prefilled from quote buttons).
export const dynamic = "force-dynamic";

export default async function ContactPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ sent?: string; error?: string; msg?: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound();
  const { sent, error, msg } = await searchParams;
  const locale = rawLocale as Locale; const d = await getSiteTexts(locale);
  return <><section className="page-hero contact-hero"><div className="page-shell"><span className="eyebrow light">Street Barbell / RVL13</span><h1>{d.contact.title}</h1><p>{d.contact.intro}</p></div></section><section className="section page-shell"><ContactForm locale={locale} initialMessage={(msg ?? "").slice(0, 2000)} sent={sent === "1"} error={error}/></section></>;
}
