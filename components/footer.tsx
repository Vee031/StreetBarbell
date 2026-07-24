import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { SiteTexts } from "@/lib/site-texts";

export function Footer({ locale, d }: { locale: Locale; d: SiteTexts }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="brand footer-brand"><span className="brand-mark">SB</span><span className="brand-word"><strong>STREET</strong> BARBELL</span></div>
          <p>{d.footer.about}</p>
        </div>
        <div>
          <h3>{d.nav.products}</h3>
          <Link href={`/${locale}/products/standard-line`}>Standard Line</Link>
          <Link href={`/${locale}/products/light-line`}>Light Line</Link>
          <Link href={`/${locale}/products/plus-line`}>Plus Line</Link>
          <Link href={`/${locale}/products`}>{d.footer.allLines}</Link>
        </div>
        <div>
          <h3>{d.footer.tools}</h3>
          <Link href={`/${locale}/configurations`}>{d.nav.configurations}</Link>
          <Link href={`/${locale}/gallery`}>{d.nav.gallery}</Link>
          <Link href={`/${locale}/faq`}>{d.nav.faq}</Link>
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
