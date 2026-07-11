import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-mark">SB</span><span className="brand-word"><strong>STREET</strong> BARBELL</span></div>
          <p>{locale === "cs" ? "Profesionální venkovní fitness vybavení pro města, distributory a soukromé investory." : "Professional outdoor fitness equipment for municipalities, distributors and private investors."}</p>
        </div>
        <div>
          <h3>{d.nav.products}</h3>
          <Link href={`/${locale}/products/standard-line`}>Standard Line</Link>
          <Link href={`/${locale}/products/light-line`}>Light Line</Link>
          <Link href={`/${locale}/products/plus-line`}>Plus Line</Link>
          <Link href={`/${locale}/products`}>{locale === "cs" ? "Všechny řady" : "All lines"}</Link>
        </div>
        <div>
          <h3>{locale === "cs" ? "Nástroje" : "Tools"}</h3>
          <Link href={`/${locale}/configurations`}>{d.nav.configurations}</Link>
          <Link href={`/${locale}/gallery`}>{d.nav.gallery}</Link>
          <Link href={`/${locale}/contact`}>{d.nav.quote}</Link>
        </div>
        <div>
          <h3>{d.nav.contact}</h3>
          <a href="mailto:export@rvl13.com"><Mail size={16} /> export@rvl13.com</a>
          <a href="https://wa.me/420721443652" target="_blank" rel="noreferrer"><MessageCircle size={16} /> +420 721 443 652</a>
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Street Barbell / RVL13</span><span>streetbarbell.cz</span></div>
    </footer>
  );
}
