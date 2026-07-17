import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { isLocale, locales, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const d = await getSiteTexts(locale);
  return <><Header locale={locale} d={d} /><main>{children}</main><Footer locale={locale} d={d} /><FloatingWhatsApp locale={locale} /></>;
}
