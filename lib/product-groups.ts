import { unstable_cache } from "next/cache";
import { readBlobJson } from "./blob-json";
import { PRODUCTS_CACHE_TAG } from "./cache-tags";

// Admin-created navigation categories with product groups, managed at
// /system/groups. Each category renders as a dropdown in the main menu; a
// "products" group is a page listing the assigned machines, a "link" group is
// a plain menu link (optionally with a hover tooltip) — e.g. the configurator.
export const GROUPS_BLOB_PATH = "content/product-groups.json";

export type ProductGroup = {
  id: string; // slug, unique within its category
  labelEn: string;
  labelCs: string;
  type: "products" | "link";
  href?: string; // link type: site-relative path without locale, e.g. "/configurations"
  tooltipEn?: string;
  tooltipCs?: string;
  subtitleEn?: string; // link type: small text under the label in the menu card (e.g. "Infinity combinations")
  subtitleCs?: string;
  // LEGACY (pre 2026-07-22): products used to be assigned per group. Membership is
  // now the product's own category (product.lineSlug === group.id) — this field is
  // ignored and kept only so old blob data still parses.
  productCodes?: string[];
  active?: boolean; // default true; false = hidden from the menu (page 404s), kept in admin
};

export type GroupCategory = {
  id: string; // slug, unique
  labelEn: string;
  labelCs: string;
  groups: ProductGroup[];
  active?: boolean; // default true; false = whole dropdown hidden from the menu
};

export const isActive = (item: { active?: boolean }) => item.active !== false;

export type ProductGroupsData = { categories: GroupCategory[] };

export function groupSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics: Doporučené -> doporucene
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function fetchProductGroupsUncached(): Promise<ProductGroupsData> {
  const data = await readBlobJson<ProductGroupsData>(GROUPS_BLOB_PATH);
  return data && Array.isArray(data.categories) ? data : { categories: [] };
}

// Same caching pattern as the other blob stores: tag-invalidated on admin saves,
// revalidate self-heals transient bad reads.
export const loadProductGroups = unstable_cache(fetchProductGroupsUncached, ["product-groups"], {
  tags: [PRODUCTS_CACHE_TAG],
  revalidate: 300,
});

// The serializable shape the (client) header needs: locale already applied.
// Cards mirror the Products mega menu: label + a small subtitle line
// (product groups: "<n> combinations"; link items: their configured subtitle).
export type GroupNavCategory = {
  id: string;
  label: string;
  items: { id: string; label: string; subtitle: string; href: string; tooltip?: string }[];
};

const nounCombinations = { en: ["combination", "combinations"] as [string, string], cs: ["kombinace", "kombinace", "kombinací"] as [string, string, string] };

function combinationsLabel(count: number, cs: boolean) {
  if (cs) return `${count} ${count === 1 ? nounCombinations.cs[0] : count >= 2 && count <= 4 ? nounCombinations.cs[1] : nounCombinations.cs[2]}`;
  return `${count} ${count === 1 ? nounCombinations.en[0] : nounCombinations.en[1]}`;
}

// enabledProducts: products currently visible on the site — a group's count is
// the number of products whose category (lineSlug) is that group.
export function buildGroupNav(data: ProductGroupsData, locale: "en" | "cs", enabledProducts: { lineSlug: string }[]): GroupNavCategory[] {
  const cs = locale === "cs";
  return data.categories.filter(isActive).map((category) => ({
    id: category.id,
    label: cs ? category.labelCs || category.labelEn : category.labelEn,
    items: category.groups.filter(isActive).map((group) => {
      const count = enabledProducts.filter((p) => p.lineSlug === group.id).length;
      return {
        id: group.id,
        label: cs ? group.labelCs || group.labelEn : group.labelEn,
        subtitle:
          group.type === "link"
            ? (cs ? group.subtitleCs || group.subtitleEn : group.subtitleEn) || ""
            : combinationsLabel(count, cs),
        href:
          group.type === "link"
            ? `/${locale}${group.href ?? "/"}`
            : `/${locale}/g/${category.id}/${group.id}`,
        tooltip: (cs ? group.tooltipCs || group.tooltipEn : group.tooltipEn) || undefined,
      };
    }),
  }));
}

// The built-in "Recommended configurations" nav link hides itself when an
// active admin category already links to the configurator (avoids a duplicate entry).
export function categoriesLinkToConfigurator(data: ProductGroupsData) {
  return data.categories.filter(isActive).some((category) => category.groups.filter(isActive).some((group) => group.type === "link" && group.href === "/configurations"));
}
