import Image from "next/image";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

const gallery = [
  ["https://streetbarbell.com/wp-content/uploads/2024/05/block2bg.jpg", "Installation"],
  ["https://streetbarbell.com/wp-content/uploads/2024/05/sb-standard-line.jpeg", "Standard Line"],
  ["https://streetbarbell.com/wp-content/uploads/2024/05/sb-light-line.jpg", "Light Line"],
  ["https://streetbarbell.com/wp-content/uploads/2024/05/sb-plus-line.jpg", "Plus Line"],
  ["https://streetbarbell.com/wp-content/uploads/2024/05/sb-workout-line.jpg", "Workout Line"],
  ["https://streetbarbell.com/wp-content/uploads/2024/05/sb-gymnastic-line.jpg", "Gymnastics Line"],
  ["https://streetbarbell.com/wp-content/uploads/2024/05/sb-cardio-line.jpg", "Cardio Line"],
  ["https://streetbarbell.com/wp-content/uploads/2024/06/perspective-view-export-26.png", "Multi Bar"],
];

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params; if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale as Locale; const d = getDictionary(locale);
  return <><section className="page-hero compact"><div className="page-shell"><span className="eyebrow light">Street Barbell</span><h1>{d.gallery.title}</h1><p>{d.gallery.intro}</p></div></section><section className="section page-shell"><div className="gallery-filter"><button className="active">{locale === "cs" ? "Vše" : "All"}</button><button>{locale === "cs" ? "Realizace" : "Installations"}</button><button>{locale === "cs" ? "Produkty" : "Products"}</button><button>{locale === "cs" ? "Proces instalace" : "Installation process"}</button></div><div className="gallery-grid">{gallery.map(([src,label],index) => <figure className={`gallery-item gallery-item-${index+1}`} key={`${src}-${index}`}><Image src={src} alt={label} fill sizes="(max-width:800px) 100vw, 50vw"/><figcaption><span>0{index+1}</span><strong>{label}</strong></figcaption></figure>)}</div></section></>;
}
