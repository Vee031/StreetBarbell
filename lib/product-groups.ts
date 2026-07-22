import { unstable_cache } from "next/cache";
import { readBlobJson } from "./blob-json";
import { PRODUCTS_CACHE_TAG } from "./products-store";

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
  productCodes?: string[]; // products type: assigned machines, in display order
};

export type GroupCategory = {
  id: string; // slug, unique
  labelEn: string;
  labelCs: string;
  groups: ProductGroup[];
};

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
export type GroupNavCategory = {
  id: string;
  label: string;
  items: { id: string; label: string; href: string; tooltip?: string }[];
};

export function buildGroupNav(data: ProductGroupsData, locale: "en" | "cs"): GroupNavCategory[] {
  const cs = locale === "cs";
  return data.categories.map((category) => ({
    id: category.id,
    label: cs ? category.labelCs || category.labelEn : category.labelEn,
    items: category.groups.map((group) => ({
      id: group.id,
      label: cs ? group.labelCs || group.labelEn : group.labelEn,
      href:
        group.type === "link"
          ? `/${locale}${group.href ?? "/"}`
          : `/${locale}/g/${category.id}/${group.id}`,
      tooltip: (cs ? group.tooltipCs || group.tooltipEn : group.tooltipEn) || undefined,
    })),
  }));
}

// The built-in "Recommended configurations" nav link hides itself when an
// admin category already links to the configurator (avoids a duplicate entry).
export function categoriesLinkToConfigurator(data: ProductGroupsData) {
  return data.categories.some((category) => category.groups.some((group) => group.type === "link" && group.href === "/configurations"));
}
