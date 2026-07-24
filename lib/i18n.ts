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
      allProducts: "All products",
      menuTitle: "Product lines",
      menuText: "A complete outdoor fitness portfolio for different users and training goals.",
      faq: "FAQ",
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
      statLines: "product lines",
      statItems: "database items",
      statPoints: "combinations",
      scroll: "Discover the system",
      advantagesTitle: "Technical quality that makes commercial sense.",
      benefit1Title: "Variable load",
      benefit1Text: "Real outdoor strength training, not only bodyweight movement.",
      benefit2Title: "Public-space durability",
      benefit2Text: "Structures engineered for intensive use, weather and vandal resistance.",
      benefit3Title: "For different user groups",
      benefit3Text: "Professionals, the general public, seniors, wheelchair users and sports teams.",
      benefit4Title: "European standards",
      benefit4Text: "Safety, documentation and technical support for public projects.",
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
      priceOnRequest: "Price on request",
      detail: "Product detail",
    },
    config: {
      title: "Recommended configurations",
      intro: "Answer the practical questions, set your priorities and compare combinations that genuinely fit the brief.",
    },
    gallery: {
      title: "Gallery",
      intro: "A first selection of Street Barbell product lines and installations. The production gallery will be expanded from the connected project archive.",
      filterAll: "All",
      filterInstallations: "Installations",
      filterProducts: "Products",
      filterProcess: "Installation process",
    },
    contact: {
      title: "Contact & quote request",
      intro: "Tell us what you are planning. The form prepares a structured enquiry for email or WhatsApp.",
    },
    faq: {
      title: "Frequently asked questions",
      intro: "Answers to the questions we hear most often about our outdoor fitness machines and services. Can't find what you're looking for? Contact us directly.",
    },
    common: {
      learnMore: "Learn more",
      email: "Email",
      whatsapp: "WhatsApp",
    },
    footer: {
      about: "Professional outdoor fitness equipment for municipalities, distributors and private investors.",
      allLines: "All lines",
      tools: "Tools",
    },
  },
  cs: {
    nav: {
      products: "Produkty",
      configurations: "Doporučené sestavy",
      gallery: "Galerie",
      contact: "Kontakt",
      quote: "Nezávazná poptávka",
      allProducts: "Všechny produkty",
      menuTitle: "Produktové řady",
      menuText: "Kompletní nabídka venkovního fitness pro různé cílové skupiny.",
      faq: "Časté dotazy",
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
      statLines: "produktových řad",
      statItems: "položek v databázi",
      statPoints: "kombinací",
      scroll: "Objevte systém",
      advantagesTitle: "Technická kvalita, která dává obchodní smysl.",
      benefit1Title: "Variabilní zátěž",
      benefit1Text: "Skutečný silový trénink venku, nikoli pouze pohyb vlastní vahou.",
      benefit2Title: "Odolnost pro veřejný prostor",
      benefit2Text: "Konstrukce navržená pro intenzivní provoz, počasí a vandalismus.",
      benefit3Title: "Pro různé cílové skupiny",
      benefit3Text: "Profesionálové, veřejnost, senioři, vozíčkáři i sportovní týmy.",
      benefit4Title: "Evropské standardy",
      benefit4Text: "Bezpečnost, dokumentace a technická podpora pro veřejné zakázky.",
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
      priceOnRequest: "Cena na vyžádání",
      detail: "Detail produktu",
    },
    config: {
      title: "Doporučené sestavy",
      intro: "Odpovězte na praktické otázky, nastavte své priority a porovnejte sestavy, které skutečně odpovídají zadání.",
    },
    gallery: {
      title: "Galerie",
      intro: "První výběr produktových řad a realizací Street Barbell. Produkční galerie bude dále rozšířena z připojeného projektového archivu.",
      filterAll: "Vše",
      filterInstallations: "Realizace",
      filterProducts: "Produkty",
      filterProcess: "Proces instalace",
    },
    contact: {
      title: "Kontakt a nezávazná poptávka",
      intro: "Popište nám svůj projekt. Formulář připraví strukturovanou poptávku pro e-mail nebo WhatsApp.",
    },
    faq: {
      title: "Časté dotazy",
      intro: "Odpovědi na otázky, které od vás slýcháme nejčastěji — k našim venkovním fitness strojům i souvisejícím službám. Nenašli jste, co jste hledali? Napište nám.",
    },
    common: {
      learnMore: "Zjistit více",
      email: "E-mail",
      whatsapp: "WhatsApp",
    },
    footer: {
      about: "Profesionální venkovní fitness vybavení pro města, distributory a soukromé investory.",
      allLines: "Všechny řady",
      tools: "Nástroje",
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
