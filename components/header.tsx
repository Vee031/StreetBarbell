"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Languages, Menu, X } from "lucide-react";
import { useState } from "react";
import { productLines } from "@/lib/data";
import { countNoun, getDictionary, nounMachines, type Locale } from "@/lib/i18n";

function switchLocale(pathname: string, locale: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "en" || parts[0] === "cs") parts[0] = locale;
  else parts.unshift(locale);
  return `/${parts.join("/")}`;
}

export function Header({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  return <HeaderContent key={pathname} locale={locale} pathname={pathname} />;
}

function HeaderContent({ locale, pathname }: { locale: Locale; pathname: string }) {
  const d = getDictionary(locale);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-shell">
        <Link href={`/${locale}`} className="brand" aria-label="Street Barbell home">
          <span className="brand-mark">SB</span>
          <span className="brand-word"><strong>STREET</strong> BARBELL</span>
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          <div className="nav-dropdown" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
            <button className="nav-link nav-button" onClick={() => setProductsOpen((v) => !v)} aria-expanded={productsOpen}>
              {d.nav.products} <ChevronDown size={15} />
            </button>
            <div className={`mega-menu ${productsOpen ? "is-open" : ""}`}>
              <div className="mega-intro">
                <span className="eyebrow">Street Barbell</span>
                <strong>{locale === "cs" ? "Produktové řady" : "Product lines"}</strong>
                <p>{locale === "cs" ? "Kompletní nabídka venkovního fitness pro různé cílové skupiny." : "A complete outdoor fitness portfolio for different users and training goals."}</p>
                <Link href={`/${locale}/products`}>{locale === "cs" ? "Všechny produkty" : "All products"} →</Link>
              </div>
              <div className="mega-grid">
                {productLines.map((line) => (
                  <Link key={line.slug} href={`/${locale}/products/${line.slug}`} className="mega-item">
                    <span>{locale === "cs" ? line.nameCs : line.nameEn}</span>
                    <small>{line.count} {countNoun(line.count, locale, nounMachines)}</small>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link className="nav-link" href={`/${locale}/configurations`}>{d.nav.configurations}</Link>
          <Link className="nav-link" href={`/${locale}/gallery`}>{d.nav.gallery}</Link>
          <Link className="nav-link" href={`/${locale}/contact`}>{d.nav.contact}</Link>
        </nav>

        <div className="header-actions">
          <div className="language-switch" aria-label="Language switcher">
            <Languages size={16} />
            <Link className={locale === "en" ? "active" : ""} href={switchLocale(pathname, "en")}>EN</Link>
            <span>/</span>
            <Link className={locale === "cs" ? "active" : ""} href={switchLocale(pathname, "cs")}>CZ</Link>
          </div>
          <Link className="button button-small button-red desktop-quote" href={`/${locale}/contact`}>{d.nav.quote}</Link>
          <button className="mobile-menu-button" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div className={`mobile-nav ${mobileOpen ? "is-open" : ""}`}>
        <button className="mobile-products-toggle" onClick={() => setProductsOpen((v) => !v)}>
          {d.nav.products}<ChevronDown size={17} />
        </button>
        {productsOpen && (
          <div className="mobile-product-list">
            <Link href={`/${locale}/products`}>{locale === "cs" ? "Všechny produkty" : "All products"}</Link>
            {productLines.map((line) => <Link key={line.slug} href={`/${locale}/products/${line.slug}`}>{locale === "cs" ? line.nameCs : line.nameEn}</Link>)}
          </div>
        )}
        <Link href={`/${locale}/configurations`}>{d.nav.configurations}</Link>
        <Link href={`/${locale}/gallery`}>{d.nav.gallery}</Link>
        <Link href={`/${locale}/contact`}>{d.nav.contact}</Link>
        <Link className="button button-red" href={`/${locale}/contact`}>{d.nav.quote}</Link>
      </div>
    </header>
  );
}
