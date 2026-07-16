import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

const gallery = [
  ["/images/photos/park-yellow.webp", "Public park installation"],
  ["/images/photos/park-seaside.webp", "Seaside installation"],
  ["/images/photos/park-canopy.webp", "Covered training zone"],
  ["/images/photos/park-aerial.webp", "Site layout"],
  ["/images/photos/park-city.webp", "Urban park"],
  ["/images/photos/park-snow.webp", "All-season durability"],
  ["/images/photos/assembly-team.webp", "Assembly and installation"],
  ["/images/photos/event-expo.webp", "Events and community"],
];

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = getDictionary(locale);
  return <><section className="page-hero compact"><div className="page-shell"><span className="eyebrow light">Street Barbell</span><h1>{d.gallery.title}</h1><p>{d.gallery.intro}</p></div></section><section className="section page-shell"><div className="gallery-filter"><button className="active">{locale === "cs" ? "Vše" : "All"}</button><button>{locale === "cs" ? "Realizace" : "Installations"}</button><button>{locale === "cs" ? "Produkty" : "Products"}</button><button>{locale === "cs" ? "Proces instalace" : "Installation process"}</button></div><div className="gallery-grid">{gallery.map(([src,label],index) => <figure className={`gallery-item gallery-item-${index+1}`} key={`${src}-${index}`}><Image src={src} alt={label} fill sizes="(max-width:800px) 100vw, 50vw"/><figcaption><span>0{index+1}</span><strong>{label}</strong></figcaption></figure>)}</div></section></>;
}
