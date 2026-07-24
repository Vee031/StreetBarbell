import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";
import { faqSections } from "@/lib/faq-data";
import { FaqAccordion } from "@/components/faq-accordion";

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = await getSiteTexts(locale);
  return (
    <>
      <section className="page-hero compact">
        <div className="page-shell">
          <span className="eyebrow light">Street Barbell</span>
          <h1>{d.faq.title}</h1>
          <p>{d.faq.intro}</p>
        </div>
      </section>
      <section className="section page-shell">
        <FaqAccordion sections={faqSections} locale={locale} />
      </section>
    </>
  );
}
