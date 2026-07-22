import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Dumbbell, ShieldCheck, Sparkles, Users } from "lucide-react";
import { LineCard } from "@/components/line-card";
import { MotionReveal } from "@/components/motion-reveal";
import { productLines } from "@/lib/data";
import { isLocale, type Locale } from "@/lib/i18n";
import { getSiteTexts } from "@/lib/site-texts";
import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const d = await getSiteTexts(locale);
  const cs = locale === "cs";
  return (
    <>
      <section className="hero">
        <Image src="/images/photos/hero-sunset.webp" alt="Street Barbell outdoor fitness" fill priority sizes="100vw" />
        <div className="hero-shade" />
        <div className="hero-grid-lines" />
        <div className="hero-content page-shell">
          <MotionReveal><span className="eyebrow light">{d.home.eyebrow}</span><h1>{d.home.title}</h1><p>{d.home.intro}</p><div className="hero-actions"><Link className="button button-red" href={`/${locale}/configurations`}>{d.home.configure}<ArrowRight size={18} /></Link><Link className="button button-ghost" href={`/${locale}/products`}>{d.home.explore}</Link></div></MotionReveal>
          <MotionReveal delay={0.18} className="hero-stat-panel">
            <div><strong>9</strong><span>{d.home.statLines}</span></div>
            <div><strong>116</strong><span>{d.home.statItems}</span></div>
            <div><strong className="stat-infinity">∞</strong><span>{d.home.statPoints}</span></div>
          </MotionReveal>
        </div>
        <div className="hero-scroll"><span>{d.home.scroll}</span><i /></div>
      </section>

      <section className="section page-shell">
        <MotionReveal className="section-heading split-heading"><div><span className="eyebrow">{d.nav.products}</span><h2>{d.home.linesTitle}</h2></div><p>{d.home.linesIntro}</p></MotionReveal>
        <div className="line-grid">{productLines.map((line, index) => <MotionReveal key={line.slug} delay={(index % 3) * 0.06}><LineCard line={line} locale={locale} /></MotionReveal>)}</div>
      </section>

      <section className="tool-feature">
        <div className="page-shell tool-feature-grid">
          <MotionReveal className="tool-copy"><span className="eyebrow light">{d.home.toolEyebrow}</span><h2>{d.home.toolTitle}</h2><p>{d.home.toolText}</p><Link className="button button-red" href={`/${locale}/configurations`}>{d.home.toolCta}<Sparkles size={18} /></Link></MotionReveal>
          <MotionReveal delay={0.15} className="tool-preview">
            <div className="preview-top"><span>STREET BARBELL</span><small>{cs ? "KONFIGURÁTOR" : "CONFIGURATOR"}</small></div>
            <div className="preview-question"><small>01</small><strong>{cs ? "Jaký je rozpočet projektu?" : "What is the project budget?"}</strong><div className="fake-input">250,000 CZK</div></div>
            <div className="preview-question"><small>02</small><strong>{cs ? "Na co se má sestava zaměřit?" : "What should the setup focus on?"}</strong><div className="fake-options"><span>{cs ? "Celé tělo" : "Full body"}</span><span>{cs ? "Dolní část" : "Lower body"}</span><span>{cs ? "Kondice" : "Conditioning"}</span></div></div>
            <div className="preview-result"><Dumbbell size={30} /><div><small>{cs ? "DOPORUČENÁ SESTAVA" : "RECOMMENDED SETUP"}</small><strong>Squat + Row + Bench Press</strong></div><span>9.2</span></div>
          </MotionReveal>
        </div>
      </section>

      <section className="section page-shell">
        <MotionReveal className="section-heading"><span className="eyebrow">{d.home.advantages}</span><h2>{d.home.advantagesTitle}</h2></MotionReveal>
        <div className="benefit-grid">
          {[
            [BadgeCheck, d.home.benefit1Title, d.home.benefit1Text],
            [ShieldCheck, d.home.benefit2Title, d.home.benefit2Text],
            [Users, d.home.benefit3Title, d.home.benefit3Text],
            [Award, d.home.benefit4Title, d.home.benefit4Text],
          ].map(([Icon, title, text], index) => <MotionReveal key={String(title)} delay={index * 0.06} className="benefit-card"><Icon /><h3>{String(title)}</h3><p>{String(text)}</p></MotionReveal>)}
        </div>
      </section>

      <section className="gallery-teaser">
        <div className="gallery-teaser-grid">
          {["park-yellow","park-seaside","park-blue","park-aerial"].map((name, index) => <div key={name} className={`gallery-tile tile-${index + 1}`}><Image src={`/images/photos/${name}.webp`} alt="Street Barbell installation" fill sizes="50vw" /></div>)}
        </div>
        <div className="gallery-teaser-copy"><span className="eyebrow light">{d.nav.gallery}</span><h2>{d.home.galleryTitle}</h2><Link className="button button-ghost" href={`/${locale}/gallery`}>{d.home.galleryCta}<ArrowRight size={18} /></Link></div>
      </section>

      <section className="contact-cta page-shell"><MotionReveal><span className="eyebrow">Street Barbell / RVL13</span><h2>{d.home.contactTitle}</h2><p>{d.home.contactText}</p><div><Link className="button button-red" href={`/${locale}/contact`}>{d.nav.quote}<ArrowRight size={18} /></Link><a className="text-link" href="mailto:export@rvl13.com">export@rvl13.com</a></div></MotionReveal></section>
    </>
  );
}
