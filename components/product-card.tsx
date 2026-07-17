import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProductName, type Product } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
import type { SiteTexts } from "@/lib/site-texts";

export function ProductCard({ product, locale, t }: { product: Product; locale: Locale; t: SiteTexts["products"] }) {
  return (
    <Link href={`/${locale}/products/${product.lineSlug}/${product.slug}`} className="product-card">
      <div className="product-image-wrap">
        <Image src={product.image || product.categoryImage} alt={getProductName(product, locale)} fill sizes="(max-width: 800px) 100vw, 33vw" />
        <span className="product-code">{product.code}</span>
      </div>
      <div className="product-card-body">
        <div>
          <small>{locale === "cs" ? product.lineCs : product.line}</small>
          <h3>{getProductName(product, locale)}</h3>
        </div>
        <div className="product-card-meta">
          <span>{product.bodyFocus}</span>
<strong>{t.priceOnRequest}</strong>
        </div>
        <span className="text-link">{t.detail} <ArrowUpRight size={16} /></span>
      </div>
    </Link>
  );
}
