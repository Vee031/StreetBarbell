import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BadgeCheck, Dumbbell, ShieldCheck, Sparkles, Users } from "lucide-react";
import { LineCard } from "@/components/line-card";
import { MotionReveal } from "@/components/motion-reveal";
import { productLines } from "@/lib/data";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale;
  const d = getDictionary(locale);
  const cs = locale === "cs";
  return (
    <>
      <section className="hero">
        <Image src="https://streetbarbell.com/wp-content/uploads/2024/05/block2bg.jpg" alt="Street Barbell outdoor fitness" fill priority sizes="100vw" />
        <div className="hero-shade" />
        <div className="hero-grid-lines" />
        <div className="hero-content page-shell">
          <MotionReveal><span className="eyebrow light">{d.home.eyebrow}</span><h1>{d.home.title}</h1><p>{d.home.intro}</p><div className="hero-actions"><Link className="button button-red" href={`/${locale}/configurations`}>{d.home.configure}<ArrowRight size={18} /></Link><Link className="button button-ghost" href={`/${locale}/products`}>{d.home.explore}</Link></div></MotionReveal>
          <MotionReveal delay={0.18} className="hero-stat-panel">
            <div><strong>9</strong><span>{cs ? "produktových řad" : "product lines"}</span></div>
            <div><strong>116</strong><span>{cs ? "položek v databázi" : "database items"}</span></div>
            <div><strong>20</strong><span>{cs ? "bodů priorit" : "priority points"}</span></div>
          </MotionReveal>
        </div>
        <div className="hero-scroll"><span>{cs ? "Objevte systém" : "Discover the system"}</span><i /></div>
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
        <MotionReveal className="section-heading"><span className="eyebrow">{d.home.advantages}</span><h2>{cs ? "Technická kvalita, která dává obchodní smysl." : "Technical quality that makes commercial sense."}</h2></MotionReveal>
        <div className="benefit-grid">
          {[
            [BadgeCheck, cs ? "Variabilní zátěž" : "Variable load", cs ? "Skutečný silový trénink venku, nikoli pouze pohyb vlastní vahou." : "Real outdoor strength training, not only bodyweight movement."],
            [ShieldCheck, cs ? "Odolnost pro veřejný prostor" : "Public-space durability", cs ? "Konstrukce navržená pro intenzivní provoz, počasí a vandalismus." : "Structures engineered for intensive use, weather and vandal resistance."],
            [Users, cs ? "Pro různé cílové skupiny" : "For different user groups", cs ? "Profesionálové, veřejnost, senioři, vozíčkáři i sportovní týmy." : "Professionals, the general public, seniors, wheelchair users and sports teams."],
            [Award, cs ? "Evropské standardy" : "European standards", cs ? "Bezpečnost, dokumentace a technická podpora pro veřejné zakázky." : "Safety, documentation and technical support for public projects."],
          ].map(([Icon, title, text], index) => <MotionReveal key={String(title)} delay={index * 0.06} className="benefit-card"><Icon /><h3>{String(title)}</h3><p>{String(text)}</p></MotionReveal>)}
        </div>
      </section>

      <section className="gallery-teaser">
        <div className="gallery-teaser-grid">
          {["sb-standard-line.jpeg","sb-light-line.jpg","sb-plus-line.jpg","sb-workout-line.jpg"].map((file, index) => <div key={file} className={`gallery-tile tile-${index + 1}`}><Image src={`https://streetbarbell.com/wp-content/uploads/2024/05/${file}`} alt="Street Barbell" fill sizes="50vw" /></div>)}
        </div>
        <div className="gallery-teaser-copy"><span className="eyebrow light">{d.nav.gallery}</span><h2>{d.home.galleryTitle}</h2><Link className="button button-ghost" href={`/${locale}/gallery`}>{d.home.galleryCta}<ArrowRight size={18} /></Link></div>
      </section>

      <section className="contact-cta page-shell"><MotionReveal><span className="eyebrow">Street Barbell / RVL13</span><h2>{d.home.contactTitle}</h2><p>{d.home.contactText}</p><div><Link className="button button-red" href={`/${locale}/contact`}>{d.nav.quote}<ArrowRight size={18} /></Link><a className="text-link" href="mailto:export@rvl13.com">export@rvl13.com</a></div></MotionReveal></section>
    </>
  );
}
