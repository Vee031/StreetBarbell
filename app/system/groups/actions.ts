"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { writeBlobJson } from "@/lib/blob-json";
import {
  fetchProductGroupsUncached,
  GROUPS_BLOB_PATH,
  groupSlug,
  type ProductGroupsData,
} from "@/lib/product-groups";
import { ALL_LINE_SLUGS } from "@/lib/generator-rules";
import { PRODUCTS_CACHE_TAG } from "@/lib/cache-tags";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/system/groups?error=storage");
}

async function saveGroups(data: ProductGroupsData) {
  await writeBlobJson(GROUPS_BLOB_PATH, data);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const labelEn = text(formData, "labelEn");
  const labelCs = text(formData, "labelCs") || labelEn;
  if (!labelEn) redirect("/system/groups?error=label");
  const id = groupSlug(labelEn);
  if (!id) redirect("/system/groups?error=label");
  const data = await fetchProductGroupsUncached();
  if (data.categories.some((c) => c.id === id)) redirect("/system/groups?error=exists");
  data.categories.push({ id, labelEn, labelCs, groups: [] });
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "categoryId");
  const data = await fetchProductGroupsUncached();
  data.categories = data.categories.filter((c) => c.id !== id);
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

export async function createGroup(formData: FormData) {
  await requireAdmin();
  const categoryId = text(formData, "categoryId");
  const labelEn = text(formData, "labelEn");
  const labelCs = text(formData, "labelCs") || labelEn;
  const type = text(formData, "type") === "link" ? "link" : "products";
  const href = text(formData, "href");
  const tooltipEn = text(formData, "tooltipEn");
  const tooltipCs = text(formData, "tooltipCs");
  const subtitleEn = text(formData, "subtitleEn");
  const subtitleCs = text(formData, "subtitleCs");
  if (!labelEn) redirect("/system/groups?error=label");
  if (type === "link" && !/^\/[a-z0-9/-]*$/i.test(href)) redirect("/system/groups?error=href");
  const id = groupSlug(labelEn);
  if (!id) redirect("/system/groups?error=label");
  // Group ids share the category namespace with the built-in lines
  // (product.lineSlug can point at either) — avoid collisions.
  if (ALL_LINE_SLUGS.includes(id)) redirect("/system/groups?error=exists");
  const data = await fetchProductGroupsUncached();
  const category = data.categories.find((c) => c.id === categoryId);
  if (!category) redirect("/system/groups");
  if (data.categories.some((c) => c.groups.some((g) => g.id === id))) redirect("/system/groups?error=exists");
  category.groups.push(
    type === "link"
      ? {
          id,
          labelEn,
          labelCs,
          type,
          href,
          tooltipEn: tooltipEn || undefined,
          tooltipCs: tooltipCs || undefined,
          subtitleEn: subtitleEn || undefined,
          subtitleCs: subtitleCs || undefined,
        }
      : { id, labelEn, labelCs, type, productCodes: [] },
  );
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

// Status pill: Aktivní / Neaktivní. Inactive items disappear from the menu
// (and their pages 404) but keep all their data.
export async function toggleCategoryActive(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "categoryId");
  const data = await fetchProductGroupsUncached();
  const category = data.categories.find((c) => c.id === id);
  if (!category) redirect("/system/groups");
  if (category.active === false) delete category.active;
  else category.active = false;
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

export async function toggleGroupActive(formData: FormData) {
  await requireAdmin();
  const categoryId = text(formData, "categoryId");
  const groupId = text(formData, "groupId");
  const data = await fetchProductGroupsUncached();
  const group = data.categories.find((c) => c.id === categoryId)?.groups.find((g) => g.id === groupId);
  if (!group) redirect("/system/groups");
  if (group.active === false) delete group.active;
  else group.active = false;
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

function swap<T>(list: T[], index: number, delta: -1 | 1) {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
}

export async function moveCategory(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "categoryId");
  const delta = text(formData, "delta") === "up" ? -1 : 1;
  const data = await fetchProductGroupsUncached();
  swap(data.categories, data.categories.findIndex((c) => c.id === id), delta as -1 | 1);
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

export async function moveGroup(formData: FormData) {
  await requireAdmin();
  const categoryId = text(formData, "categoryId");
  const groupId = text(formData, "groupId");
  const delta = text(formData, "delta") === "up" ? -1 : 1;
  const data = await fetchProductGroupsUncached();
  const category = data.categories.find((c) => c.id === categoryId);
  if (!category) redirect("/system/groups");
  swap(category.groups, category.groups.findIndex((g) => g.id === groupId), delta as -1 | 1);
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

export async function deleteGroup(formData: FormData) {
  await requireAdmin();
  const categoryId = text(formData, "categoryId");
  const groupId = text(formData, "groupId");
  const data = await fetchProductGroupsUncached();
  const category = data.categories.find((c) => c.id === categoryId);
  if (category) category.groups = category.groups.filter((g) => g.id !== groupId);
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}

