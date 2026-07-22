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
import { getProducts, PRODUCTS_CACHE_TAG } from "@/lib/products-store";

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
  if (!labelEn) redirect("/system/groups?error=label");
  if (type === "link" && !/^\/[a-z0-9/-]*$/i.test(href)) redirect("/system/groups?error=href");
  const id = groupSlug(labelEn);
  if (!id) redirect("/system/groups?error=label");
  const data = await fetchProductGroupsUncached();
  const category = data.categories.find((c) => c.id === categoryId);
  if (!category) redirect("/system/groups");
  if (category.groups.some((g) => g.id === id)) redirect("/system/groups?error=exists");
  category.groups.push(
    type === "link"
      ? { id, labelEn, labelCs, type, href, tooltipEn: tooltipEn || undefined, tooltipCs: tooltipCs || undefined }
      : { id, labelEn, labelCs, type, productCodes: [] },
  );
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

export async function saveGroupProducts(formData: FormData) {
  await requireAdmin();
  const categoryId = text(formData, "categoryId");
  const groupId = text(formData, "groupId");
  const validCodes = new Set((await getProducts()).map((p) => p.code));
  const codes = formData
    .getAll("codes")
    .map((v) => String(v))
    .filter((code) => validCodes.has(code));
  const data = await fetchProductGroupsUncached();
  const group = data.categories.find((c) => c.id === categoryId)?.groups.find((g) => g.id === groupId);
  if (!group || group.type !== "products") redirect("/system/groups");
  group.productCodes = codes;
  await saveGroups(data);
  redirect("/system/groups?saved=1");
}
