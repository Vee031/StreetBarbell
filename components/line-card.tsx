import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductLine } from "@/lib/data";
import type { Locale } from "@/lib/i18n";

export function LineCard({ line, locale }: { line: ProductLine; locale: Locale }) {
  return (
    <Link href={`/${locale}/products/${line.slug}`} className="line-card">
      <Image src={line.image} alt={locale === "cs" ? line.nameCs : line.nameEn} fill sizes="(max-width: 800px) 100vw, 33vw" />
      <span className="line-card-overlay" />
      <div className="line-card-content">
        <small>{line.count} {locale === "cs" ? "produktů" : "products"}</small>
        <h3>{locale === "cs" ? line.nameCs : line.nameEn}</h3>
        <span className="round-icon"><ArrowUpRight size={19} /></span>
      </div>
    </Link>
  );
}
