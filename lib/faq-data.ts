// Source: "SB FAQ 2026.docx" (owner-supplied). Czech copy is a translation of
// the English original, not a separate source — keep both in sync by hand.

export type FaqTable = {
  headers: { en: string[]; cs: string[] };
  rows: { labelEn: string; labelCs: string; valuesEn: string[]; valuesCs: string[] }[];
};

export type FaqItem = {
  id: string;
  qEn: string;
  qCs: string;
  aEn?: string;
  aCs?: string;
  table?: FaqTable;
};

export type FaqSection = {
  id: string;
  titleEn: string;
  titleCs: string;
  items: FaqItem[];
};

export const faqSections: FaqSection[] = [
  {
    id: "products",
    titleEn: "Products",
    titleCs: "Produkty",
    items: [
      {
        id: "right-setup",
        qEn: "How can we choose the right setup?",
        qCs: "Jak vybrat správnou sestavu?",
        aEn: "Use our free online configurator or contact our sales team — we're happy to help with the selection. The most important factors are available space, available budget, whether calisthenics equipment already exists on site, and the overall purpose of the installation.",
        aCs: "Použijte náš bezplatný online konfigurátor, nebo kontaktujte náš obchodní tým — rádi vám s výběrem pomůžeme. Nejdůležitější kritéria pro správnou volbu jsou: dostupný prostor, dostupný rozpočet, případná existence workoutového vybavení na místě a celkový účel instalace.",
      },
      {
        id: "line-difference",
        qEn: "What is the difference between the Standard, Light, Pro and Plus lines?",
        qCs: "Jaký je rozdíl mezi řadami Standard, Light, Pro a Plus?",
        table: {
          headers: { en: ["", "Standard", "Light", "Pro", "Plus"], cs: ["", "Standard", "Light", "Pro", "Plus"] },
          rows: [
            { labelEn: "Pillars", labelCs: "Sloupy", valuesEn: ["3+", "4+", "3+", "4+"], valuesCs: ["3+", "4+", "3+", "4+"] },
            { labelEn: "Anchoring", labelCs: "Kotvení", valuesEn: ["Necessary", "Not necessary", "Necessary", "Necessary"], valuesCs: ["Nutné", "Není nutné", "Nutné", "Nutné"] },
            { labelEn: "User", labelCs: "Uživatel", valuesEn: ["Everybody", "Everybody", "Athletes", "Wheelchair accessible"], valuesCs: ["Kdokoli", "Kdokoli", "Sportovci", "Bezbariérový přístup"] },
            { labelEn: "Price", labelCs: "Cena", valuesEn: ["Medium", "Lower", "High", "High"], valuesCs: ["Střední", "Nižší", "Vysoká", "Vysoká"] },
            { labelEn: "Exercise position", labelCs: "Poloha při cvičení", valuesEn: ["Standing", "Sitting", "Mixed", "Sitting"], valuesCs: ["Ve stoje", "Vsedě", "Kombinovaná", "Vsedě"] },
          ],
        },
      },
      {
        id: "max-load",
        qEn: "What is the maximum load of each machine?",
        qCs: "Jaké je maximální zatížení jednotlivých strojů?",
        aEn: "The usual load range is between 100–200 kg, depending on the specific machine. You can find the exact specification for each product on our website.",
        aCs: "Obvyklé zatížení se pohybuje mezi 100–200 kg v závislosti na konkrétním stroji. Přesnou specifikaci ke každému produktu najdete na našich webových stránkách.",
      },
      {
        id: "total-weight",
        qEn: "How much do the machines weigh in total?",
        qCs: "Kolik váží stroje celkově?",
        aEn: "Our machines weigh around 400 kg including the weight stack.",
        aCs: "Naše stroje váží zhruba 400 kg včetně závaží.",
      },
      {
        id: "surface-treatment",
        qEn: "What surface treatments are available?",
        qCs: "Jaké povrchové úpravy jsou k dispozici?",
        aEn: "The standard finish is primer plus Komaxit powder coating. For installation in harsh conditions (seaside locations, extreme temperatures, etc.), the machines are hot-dip galvanized and then coated with Komaxit. This upgrade comes with a notable surcharge of 30%.",
        aCs: "Standardní úprava je základová barva a komaxitový nástřik. Pro instalaci v náročných podmínkách (přímořské lokality, extrémní teploty apod.) jsou stroje žárově zinkované a následně opatřené komaxitem. Toto vylepšení je spojeno s příplatkem ve výši 30 %.",
      },
      {
        id: "colors",
        qEn: "What colors can we choose from?",
        qCs: "Jaké barvy si můžeme vybrat?",
        aEn: "We strongly recommend using a combination of two colors. We can accommodate most color requests, but if you're in a hurry, we recommend sticking to the color palette available on our website.",
        aCs: "Doporučujeme kombinaci dvou barev. Dokážeme vyhovět většině barevných požadavků, ale pokud spěcháte, doporučujeme zvolit z barevné palety dostupné na našich webových stránkách.",
      },
    ],
  },
  {
    id: "services",
    titleEn: "Services",
    titleCs: "Služby",
    items: [
      {
        id: "transport",
        qEn: "How are the machines transported?",
        qCs: "Jak probíhá doprava strojů?",
        aEn: "Each machine is carefully wrapped and secured to a pallet measuring 1.4 × 2.1 m.",
        aCs: "Každý stroj je pečlivě zabalen a upevněn na paletě o rozměrech 1,4 × 2,1 m.",
      },
      {
        id: "warranty",
        qEn: "What is the warranty?",
        qCs: "Jaká je záruka?",
        aEn: "The warranty is 1 year from installation / handover.",
        aCs: "Záruka je 1 rok od instalace / předání.",
      },
      {
        id: "delivery",
        qEn: "Who takes care of the delivery?",
        qCs: "Kdo zajišťuje dopravu na místo?",
        aEn: "We take care of delivering each machine directly to your project and placing it as requested.",
        aCs: "O dopravu každého stroje přímo na váš projekt a jeho umístění dle požadavků se staráme my.",
      },
      {
        id: "purchase-scope",
        qEn: "What exactly is included when purchasing Street Barbell machines?",
        qCs: "Co přesně zahrnuje nákup strojů Street Barbell?",
        aEn: "Each price offer can include: price of the machines, handling and installation fee, preparation of concrete foundations, and installation of the sports surfacing. Every item on this list is optional, and we will do our best to fit your specific norms and certification requirements.",
        aCs: "Každá cenová nabídka může zahrnovat: cenu strojů, manipulační poplatek a instalaci, přípravu betonových základů a instalaci sportovního povrchu. Každá položka je volitelná a rádi nabídku přizpůsobíme vašim konkrétním normám a certifikačním požadavkům.",
      },
      {
        id: "documents",
        qEn: "What documents can you provide with the machines?",
        qCs: "Jaké dokumenty ke strojům poskytujete?",
        aEn: "We hold TÜV certification for EN 16630 — publicly installed, free-standing fitness equipment. We also hold a patent for our unique rail technology for adjusting the weights, which ensures safe load variability. In addition, every machine comes with a product datasheet and technical documentation.",
        aCs: "Disponujeme certifikací TÜV dle normy EN 16630 pro veřejně instalované, volně stojící fitness vybavení. Dále vlastníme patent na unikátní technologii kolejnic pro manipulaci se závažím, která zajišťuje bezpečnou variabilitu zátěže. Ke každému stroji navíc dodáváme produktový list a technickou dokumentaci.",
      },
    ],
  },
];
