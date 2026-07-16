export const locales = ["en", "cs"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const dictionaries = {
  en: {
    nav: {
      products: "Products",
      configurations: "Recommended configurations",
      gallery: "Gallery",
      contact: "Contact",
      quote: "Request a quote",
    },
    home: {
      eyebrow: "Outdoor strength. Built without compromise.",
      title: "Build the right outdoor gym — not just a collection of machines.",
      intro: "Professional outdoor fitness equipment and an intelligent configuration tool for distributors, municipalities, architects and operators.",
      configure: "Build a configuration",
      explore: "Explore products",
      linesTitle: "Nine product lines. One complete system.",
      linesIntro: "From accessible public fitness to professional variable-load strength training, choose the right equipment for every site and audience.",
      toolEyebrow: "Distributor tool",
      toolTitle: "Turn a budget and a training goal into a defensible recommendation.",
      toolText: "The configurator evaluates price, body focus, an existing workout structure, exercise position, space, accessibility and the client's own 20-point priority matrix.",
      toolCta: "Open the configurator",
      advantages: "Why Street Barbell",
      galleryTitle: "Equipment made for real public spaces.",
      galleryCta: "View gallery",
      contactTitle: "Have a project in mind?",
      contactText: "Send us the location, available area and approximate budget. We will help you prepare a technically sound setup.",
    },
    products: {
      title: "Products",
      intro: "Browse all Street Barbell equipment by product line.",
      machines: "machines",
      viewLine: "View product line",
      back: "Back to products",
      noProducts: "No products were found in this category.",
      specification: "Technical specification",
      muscles: "Target muscles",
      dimensions: "Dimensions",
      weight: "Equipment weight",
      load: "Load specification",
      position: "Exercise position",
      materials: "Materials and finish",
      frame: "Frame",
      rails: "Rails",
      smallParts: "Small parts",
      finish: "Finish",
      quoteProduct: "Request this product",
      openSource: "Original product source",
      from: "From",
      exVat: "excl. VAT",
    },
    config: {
      title: "Recommended configurations",
      intro: "Answer the practical questions, distribute exactly 20 priority points and compare combinations that genuinely fit the brief.",
    },
    gallery: {
      title: "Gallery",
      intro: "A first selection of Street Barbell product lines and installations. The production gallery will be expanded from the connected project archive.",
    },
    contact: {
      title: "Contact & quote request",
      intro: "Tell us what you are planning. The form prepares a structured enquiry for email or WhatsApp.",
    },
    common: {
      learnMore: "Learn more",
      email: "Email",
      whatsapp: "WhatsApp",
    },
  },
  cs: {
    nav: {
      products: "Produkty",
      configurations: "Doporučené sestavy",
      gallery: "Galerie",
      contact: "Kontakt",
      quote: "Nezávazná poptávka",
    },
    home: {
      eyebrow: "Venkovní síla. Bez kompromisů.",
      title: "Navrhněte správnou venkovní posilovnu — ne pouze náhodnou skupinu strojů.",
      intro: "Profesionální venkovní fitness vybavení a inteligentní konfigurační nástroj pro distributory, města, architekty a provozovatele.",
      configure: "Navrhnout sestavu",
      explore: "Prohlédnout produkty",
      linesTitle: "Devět produktových řad. Jeden kompletní systém.",
      linesIntro: "Od přístupného veřejného fitness až po profesionální silový trénink s variabilní zátěží — vyberte správné vybavení pro každé místo i cílovou skupinu.",
      toolEyebrow: "Nástroj pro distributory",
      toolTitle: "Proměňte rozpočet a tréninkový cíl v obhajitelné doporučení.",
      toolText: "Konfigurátor vyhodnocuje cenu, zaměření tréninku, existující workoutovou konstrukci, polohu při cvičení, prostor, přístupnost a vlastní dvacetibodovou matici priorit klienta.",
      toolCta: "Otevřít konfigurátor",
      advantages: "Proč Street Barbell",
      galleryTitle: "Vybavení vytvořené pro skutečný veřejný prostor.",
      galleryCta: "Zobrazit galerii",
      contactTitle: "Máte konkrétní projekt?",
      contactText: "Pošlete nám lokalitu, dostupnou plochu a přibližný rozpočet. Pomůžeme připravit technicky smysluplnou sestavu.",
    },
    products: {
      title: "Produkty",
      intro: "Prohlédněte si veškeré vybavení Street Barbell podle produktových řad.",
      machines: "strojů",
      viewLine: "Zobrazit produktovou řadu",
      back: "Zpět na produkty",
      noProducts: "V této kategorii nebyly nalezeny žádné produkty.",
      specification: "Technické parametry",
      muscles: "Cílové svalové skupiny",
      dimensions: "Rozměry",
      weight: "Hmotnost stroje",
      load: "Specifikace zátěže",
      position: "Poloha při cvičení",
      materials: "Materiály a povrchová úprava",
      frame: "Rám",
      rails: "Vodicí prvky",
      smallParts: "Drobné díly",
      finish: "Povrchová úprava",
      quoteProduct: "Poptat tento produkt",
      openSource: "Původní zdroj produktu",
      from: "Od",
      exVat: "bez DPH",
    },
    config: {
      title: "Doporučené sestavy",
      intro: "Odpovězte na praktické otázky, rozdělte přesně 20 prioritních bodů a porovnejte sestavy, které skutečně odpovídají zadání.",
    },
    gallery: {
      title: "Galerie",
      intro: "První výběr produktových řad a realizací Street Barbell. Produkční galerie bude dále rozšířena z připojeného projektového archivu.",
    },
    contact: {
      title: "Kontakt a nezávazná poptávka",
      intro: "Popište nám svůj projekt. Formulář připraví strukturovanou poptávku pro e-mail nebo WhatsApp.",
    },
    common: {
      learnMore: "Zjistit více",
      email: "E-mail",
      whatsapp: "WhatsApp",
    },
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

// Czech has three plural forms: 1 stroj, 2–4 stroje, 5+ strojů.
export function countNoun(count: number, locale: Locale, forms: { en: [string, string]; cs: [string, string, string] }) {
  if (locale === "cs") {
    if (count === 1) return forms.cs[0];
    if (count >= 2 && count <= 4) return forms.cs[1];
    return forms.cs[2];
  }
  return count === 1 ? forms.en[0] : forms.en[1];
}

export const nounMachines = { en: ["machine", "machines"] as [string, string], cs: ["stroj", "stroje", "strojů"] as [string, string, string] };
export const nounProducts = { en: ["product", "products"] as [string, string], cs: ["produkt", "produkty", "produktů"] as [string, string, string] };
