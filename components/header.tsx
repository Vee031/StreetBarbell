"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Languages, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { productLines } from "@/lib/data";
import { countNoun, nounMachines, type Locale } from "@/lib/i18n";
import type { GroupNavCategory } from "@/lib/product-groups";
import type { SiteTexts } from "@/lib/site-texts";
import { teamLogout } from "@/app/[locale]/team-login/actions";

function switchLocale(pathname: string, locale: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "en" || parts[0] === "cs") parts[0] = locale;
  else parts.unshift(locale);
  return `/${parts.join("/")}`;
}

type HeaderProps = { locale: Locale; d: SiteTexts; groupNav?: GroupNavCategory[]; hideConfigLink?: boolean };

export function Header({ locale, d, groupNav = [], hideConfigLink = false }: HeaderProps) {
  const pathname = usePathname();
  return <HeaderContent key={pathname} locale={locale} d={d} groupNav={groupNav} hideConfigLink={hideConfigLink} pathname={pathname} />;
}

function HeaderContent({ locale, d, groupNav, hideConfigLink, pathname }: HeaderProps & { groupNav: GroupNavCategory[]; hideConfigLink: boolean; pathname: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [teamEmail, setTeamEmail] = useState<string | null>(null);
  const cs = locale === "cs";

  useEffect(() => {
    let active = true;
    fetch("/api/team-status").then((r) => r.json()).then((data) => { if (active) setTeamEmail(data.email ?? null); }).catch(() => {});
    return () => { active = false; };
  }, [pathname]);

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
                <strong>{d.nav.menuTitle}</strong>
                <p>{d.nav.menuText}</p>
                <Link href={`/${locale}/products`}>{d.nav.allProducts} →</Link>
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
          {groupNav.map((category) => (
            <div className="nav-dropdown" key={category.id} onMouseEnter={() => setOpenCategory(category.id)} onMouseLeave={() => setOpenCategory((v) => (v === category.id ? null : v))}>
              <button className="nav-link nav-button" onClick={() => setOpenCategory((v) => (v === category.id ? null : category.id))} aria-expanded={openCategory === category.id}>
                {category.label} <ChevronDown size={15} />
              </button>
              <div className={`group-menu ${openCategory === category.id ? "is-open" : ""}`}>
                <div className="group-menu-grid">
                  {category.items.map((item) => (
                    <Link key={item.id} href={item.href} className="mega-item group-menu-item">
                      <span>{item.label}</span>
                      <small>{item.subtitle}</small>
                      {item.tooltip && <span className="nav-tooltip" role="tooltip">{item.tooltip}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {!hideConfigLink && <Link className="nav-link" href={`/${locale}/configurations`}>{d.nav.configurations}</Link>}
          <Link className="nav-link" href={`/${locale}/gallery`}>{d.nav.gallery}</Link>
          <Link className="nav-link" href={`/${locale}/contact`}>{d.nav.contact}</Link>
        </nav>

        <div className="header-actions">
          {teamEmail ? (
            <form action={teamLogout} className="team-signin"><input type="hidden" name="locale" value={locale} /><button type="submit" title={teamEmail}>{cs ? "Odhlásit" : "Sign out"}</button></form>
          ) : (
            <Link className="team-signin" href={`/${locale}/team-login`}>{cs ? "Přihlášení týmu" : "Team sign in"}</Link>
          )}
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
            <Link href={`/${locale}/products`}>{d.nav.allProducts}</Link>
            {productLines.map((line) => <Link key={line.slug} href={`/${locale}/products/${line.slug}`}>{locale === "cs" ? line.nameCs : line.nameEn}</Link>)}
          </div>
        )}
        {groupNav.map((category) => (
          <div className="mobile-group" key={category.id}>
            <span className="mobile-group-label">{category.label}</span>
            {category.items.map((item) => <Link key={item.id} href={item.href}>{item.label}</Link>)}
          </div>
        ))}
        {!hideConfigLink && <Link href={`/${locale}/configurations`}>{d.nav.configurations}</Link>}
        <Link href={`/${locale}/gallery`}>{d.nav.gallery}</Link>
        <Link href={`/${locale}/contact`}>{d.nav.contact}</Link>
        <Link className="button button-red" href={`/${locale}/contact`}>{d.nav.quote}</Link>
      </div>
    </header>
  );
}
