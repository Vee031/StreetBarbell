"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { writeBlobJson } from "@/lib/blob-json";
import { products } from "@/lib/data";
import { MUSCLE_SHAPES } from "@/lib/muscle-figure";
import { fetchProductMetaUncached, META_BLOB_PATH, youtubeVideoId, type ProductMetaMap } from "@/lib/product-meta";
import { fetchProductGroupsUncached, GROUPS_BLOB_PATH } from "@/lib/product-groups";
import {
  buildCategoryMap,
  customToProduct,
  CUSTOM_PRODUCTS_BLOB_PATH,
  fetchCustomProductsUncached,
  fetchProductOrderUncached,
  fetchProductOverridesUncached,
  getProducts,
  POSITION_OPTIONS,
  PRODUCT_ORDER_BLOB_PATH,
  PRODUCTS_BLOB_PATH,
  PRODUCTS_CACHE_TAG,
  productSlugFor,
  type CustomProductRecord,
} from "@/lib/products-store";

// Valid category values: the 9 built-in lines + admin-created combination groups.
async function categorySlugs(): Promise<Set<string>> {
  return new Set(buildCategoryMap(await fetchProductGroupsUncached()).keys());
}

// Base + admin-created codes; custom machines are editable here like any other.
async function lookupProduct(code: string): Promise<{ code: string; slug: string; custom: boolean } | null> {
  const base = products.find((p) => p.code === code);
  if (base) return { code: base.code, slug: base.slug, custom: false };
  const custom = (await fetchCustomProductsUncached())[code];
  return custom ? { code: custom.code, slug: productSlugFor(custom.code, custom.nameEn), custom: true } : null;
}

function mediaPath(code: string, kind: "gallery" | "docs", fileName: string) {
  const safeCode = code.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const safeName = fileName.replace(/[^a-z0-9._-]+/gi, "_").slice(-80);
  return `products-media/${safeCode}/${kind}/${Date.now()}-${safeName}`;
}

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/system/catalog?error=storage");
}

async function saveMeta(meta: ProductMetaMap) {
  await writeBlobJson(META_BLOB_PATH, meta);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
}

// Resolves the submitted code to {code, slug, custom} or bails to the catalogue list.
async function requireProduct(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const product = await lookupProduct(code);
  if (!product) redirect("/system/catalog");
  return product;
}

function editorPath(slug: string, suffix = "") {
  return `/system/catalog/${slug}${suffix}`;
}

export async function toggleProduct(formData: FormData) {
  await requireAdmin();
  const { code, slug } = await requireProduct(formData);
  const enable = String(formData.get("enable")) === "true";
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  if (enable) delete entry.enabled;
  else entry.enabled = false;
  meta[code] = entry;
  await saveMeta(meta);
  redirect(editorPath(slug, "?saved=1"));
}

export async function saveVideoAndMuscles(formData: FormData) {
  await requireAdmin();
  const { code, slug } = await requireProduct(formData);
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  if (youtubeUrl && !youtubeVideoId(youtubeUrl)) redirect(editorPath(slug, "?error=youtube"));
  const shapes = [
    ...new Set(
      String(formData.get("muscleShapes") ?? "")
        .split(",")
        .map((v) => Number.parseInt(v, 10))
        .filter((n) => Number.isInteger(n) && n >= 0 && n < MUSCLE_SHAPES.length),
    ),
  ].sort((a, b) => a - b);
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  if (youtubeUrl) entry.youtubeUrl = youtubeUrl;
  else delete entry.youtubeUrl;
  entry.muscleShapes = shapes;
  delete entry.muscles; // superseded by the explicit per-region selection
  meta[code] = entry;
  await saveMeta(meta);
  redirect(editorPath(slug, "?saved=1"));
}

export async function savePosition(formData: FormData) {
  await requireAdmin();
  const { code, slug } = await requireProduct(formData);
  const position = String(formData.get("position") ?? "").trim();
  if (position && !POSITION_OPTIONS.includes(position)) redirect(editorPath(slug));
  // Stored in the same overrides set as the XLSX import, so the public page, the
  // configurator and the downloaded products.xlsx template all pick it up.
  const overrides = await fetchProductOverridesUncached();
  const entry = { ...(overrides[code] ?? {}) };
  const base = products.find((p) => p.code === code);
  if (!position || position === base?.position) delete entry.position;
  else entry.position = position;
  if (Object.keys(entry).length === 0) delete overrides[code];
  else overrides[code] = entry;
  await writeBlobJson(PRODUCTS_BLOB_PATH, overrides);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect(editorPath(slug, "?saved=1"));
}

// Code & name editing. Admin-created products: both editable (a code change
// re-keys the catalogue meta and XLSX overrides; the slug — and therefore the
// web address — follows the new code/name). Built-in machines: the code is the
// permanent identifier (pricing, muscle data) and cannot change; the display
// names are stored as overrides, empty field = back to the built-in name.
export async function saveIdentity(formData: FormData) {
  await requireAdmin();
  const { code, slug, custom } = await requireProduct(formData);
  const nameEn = String(formData.get("nameEn") ?? "").trim().slice(0, 120);
  const nameCs = String(formData.get("nameCs") ?? "").trim().slice(0, 120);

  if (custom) {
    const newCode = (String(formData.get("newCode") ?? "").trim() || code).slice(0, 24);
    if (!/^[A-Za-z0-9 ./-]{2,24}$/.test(newCode)) redirect(editorPath(slug, "?error=code"));
    if (!nameEn) redirect(editorPath(slug, "?error=name"));
    const customs = await fetchCustomProductsUncached();
    const record = customs[code];
    if (!record) redirect("/system/catalog");
    if (newCode !== code && (products.some((p) => p.code === newCode) || customs[newCode])) redirect(editorPath(slug, "?error=exists"));
    delete customs[code];
    customs[newCode] = { ...record, code: newCode, nameEn, nameCs: nameCs || nameEn };
    await writeBlobJson(CUSTOM_PRODUCTS_BLOB_PATH, customs);
    if (newCode !== code) {
      const meta = await fetchProductMetaUncached();
      if (meta[code]) {
        meta[newCode] = meta[code];
        delete meta[code];
        await writeBlobJson(META_BLOB_PATH, meta);
      }
      const overrides = await fetchProductOverridesUncached();
      if (overrides[code]) {
        overrides[newCode] = overrides[code];
        delete overrides[code];
        await writeBlobJson(PRODUCTS_BLOB_PATH, overrides);
      }
    }
    updateTag(PRODUCTS_CACHE_TAG);
    revalidatePath("/", "layout");
    redirect(editorPath(productSlugFor(newCode, nameEn), "?saved=1"));
  }

  // Built-in machine: names as diffs-only overrides (same store as the XLSX import).
  const base = products.find((p) => p.code === code);
  const overrides = await fetchProductOverridesUncached();
  const entry = { ...(overrides[code] ?? {}) };
  if (!nameEn || nameEn === base?.nameEn) delete entry.nameEn;
  else entry.nameEn = nameEn;
  if (!nameCs || nameCs === base?.nameCs) delete entry.nameCs;
  else entry.nameCs = nameCs;
  if (Object.keys(entry).length === 0) delete overrides[code];
  else overrides[code] = entry;
  await writeBlobJson(PRODUCTS_BLOB_PATH, overrides);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect(editorPath(slug, "?saved=1"));
}

// Persists the drag-and-drop sequence of one catalogue section (line or group).
// The order drives the public line/group pages and the catalogue listing.
export async function saveProductOrder(formData: FormData) {
  await requireAdmin();
  const category = String(formData.get("category") ?? "").trim();
  if (!(await categorySlugs()).has(category)) redirect("/system/catalog");
  const submitted = String(formData.get("codes") ?? "")
    .split("|")
    .map((code) => code.trim())
    .filter(Boolean);
  // Only codes that genuinely belong to this category are stored.
  const memberCodes = new Set((await getProducts()).filter((p) => p.lineSlug === category).map((p) => p.code));
  const ordered = submitted.filter((code) => memberCodes.has(code));
  const order = await fetchProductOrderUncached();
  order[category] = ordered;
  await writeBlobJson(PRODUCT_ORDER_BLOB_PATH, order);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect("/system/catalog?ordered=1");
}

// The wording on the product page: descriptions, target-muscles line, movement
// patterns. Stored as diffs-only overrides (the same store the XLSX import uses,
// so the spreadsheet template round-trips them). Empty field = back to the
// built-in / as-created text. Editing "Target muscles" also re-drives the
// auto-detected muscle figure when no explicit region selection is saved.
const TEXT_FIELDS = ["descriptionEn", "descriptionCs", "muscles", "movementPatterns"] as const;

export async function saveTexts(formData: FormData) {
  await requireAdmin();
  const { code, slug, custom } = await requireProduct(formData);
  let base: Record<(typeof TEXT_FIELDS)[number], string> | undefined = products.find((p) => p.code === code);
  if (custom) {
    const record = (await fetchCustomProductsUncached())[code];
    if (record) base = customToProduct(record, buildCategoryMap(await fetchProductGroupsUncached()));
  }
  const overrides = await fetchProductOverridesUncached();
  const entry = { ...(overrides[code] ?? {}) };
  for (const field of TEXT_FIELDS) {
    const value = String(formData.get(field) ?? "").trim().slice(0, 4000);
    if (!value || value === base?.[field]) delete entry[field];
    else entry[field] = value;
  }
  if (Object.keys(entry).length === 0) delete overrides[code];
  else overrides[code] = entry;
  await writeBlobJson(PRODUCTS_BLOB_PATH, overrides);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect(editorPath(slug, "?saved=1"));
}

export async function saveLine(formData: FormData) {
  await requireAdmin();
  const { code, slug } = await requireProduct(formData);
  const lineSlug = String(formData.get("lineSlug") ?? "").trim();
  if (!(await categorySlugs()).has(lineSlug)) redirect(editorPath(slug));
  // Same overrides store as the XLSX import ("Line" column) — moving a machine
  // here re-homes it on the website, in product lists and in the configurator.
  const overrides = await fetchProductOverridesUncached();
  const entry = { ...(overrides[code] ?? {}) };
  const custom = (await fetchCustomProductsUncached())[code];
  const baseLine = custom?.lineSlug ?? products.find((p) => p.code === code)?.lineSlug;
  if (lineSlug === baseLine) delete entry.lineSlug;
  else entry.lineSlug = lineSlug;
  if (Object.keys(entry).length === 0) delete overrides[code];
  else overrides[code] = entry;
  await writeBlobJson(PRODUCTS_BLOB_PATH, overrides);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect(editorPath(slug, "?saved=1"));
}

export async function uploadGalleryImages(formData: FormData) {
  await requireAdmin();
  const { code, slug, custom } = await requireProduct(formData);
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) redirect(editorPath(slug, "?error=nofile"));
  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) redirect(editorPath(slug, "?error=notimage"));
    if (file.size > 8 * 1024 * 1024) redirect(editorPath(slug, "?error=toobig"));
    const blob = await put(mediaPath(code, "gallery", file.name), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      abortSignal: AbortSignal.timeout(30000),
    });
    urls.push(blob.url);
  }
  // Admin-created products without an own main picture: the FIRST uploaded photo
  // becomes the main picture (otherwise the line's stock photo stays dominant and
  // uploads look like they "disappear" into the mini gallery).
  if (custom) {
    const customs = await fetchCustomProductsUncached();
    const record = customs[code];
    if (record && !record.image && urls.length > 0) {
      record.image = urls.shift() as string;
      customs[code] = record;
      await writeBlobJson(CUSTOM_PRODUCTS_BLOB_PATH, customs);
    }
  }
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  entry.gallery = [...(entry.gallery ?? []), ...urls];
  meta[code] = entry;
  await saveMeta(meta);
  redirect(editorPath(slug, "?saved=1"));
}

// Custom products: promote a gallery photo to the main picture; the previous
// main picture (if any) moves into the gallery so nothing is lost.
export async function makeMainImage(formData: FormData) {
  await requireAdmin();
  const { code, slug, custom } = await requireProduct(formData);
  if (!custom) redirect(editorPath(slug));
  const url = String(formData.get("url") ?? "");
  const customs = await fetchCustomProductsUncached();
  const record = customs[code];
  if (!record) redirect("/system/catalog");
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  const gallery = entry.gallery ?? [];
  if (!gallery.includes(url)) redirect(editorPath(slug));
  entry.gallery = gallery.filter((item) => item !== url);
  if (record.image) entry.gallery = [record.image, ...entry.gallery];
  meta[code] = entry;
  record.image = url;
  customs[code] = record;
  await writeBlobJson(CUSTOM_PRODUCTS_BLOB_PATH, customs);
  await saveMeta(meta);
  redirect(editorPath(slug, "?saved=1"));
}

export async function deleteGalleryImage(formData: FormData) {
  await requireAdmin();
  const { code, slug } = await requireProduct(formData);
  const url = String(formData.get("url") ?? "");
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  entry.gallery = (entry.gallery ?? []).filter((item) => item !== url);
  meta[code] = entry;
  await saveMeta(meta);
  try { await del(url); } catch { /* blob already gone — the reference is removed either way */ }
  redirect(editorPath(slug, "?saved=1"));
}

export async function uploadDocument(formData: FormData) {
  await requireAdmin();
  const { code, slug } = await requireProduct(formData);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(editorPath(slug, "?error=nofile"));
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) redirect(editorPath(slug, "?error=notpdf"));
  if (file.size > 25 * 1024 * 1024) redirect(editorPath(slug, "?error=toobig"));
  const displayName = String(formData.get("name") ?? "").trim() || file.name.replace(/\.pdf$/i, "");
  const blob = await put(mediaPath(code, "docs", file.name), file, {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/pdf",
    abortSignal: AbortSignal.timeout(60000),
  });
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  entry.documents = [...(entry.documents ?? []), { name: displayName, url: blob.url }];
  meta[code] = entry;
  await saveMeta(meta);
  redirect(editorPath(slug, "?saved=1"));
}

// --- Admin-created products -------------------------------------------------

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("newCode") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim();
  const nameCs = String(formData.get("nameCs") ?? "").trim();
  const lineSlug = String(formData.get("lineSlug") ?? "").trim();
  const descriptionEn = String(formData.get("descriptionEn") ?? "").trim();
  const descriptionCs = String(formData.get("descriptionCs") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();

  if (!/^[A-Za-z0-9 ./-]{2,24}$/.test(code)) redirect("/system/catalog/new?error=code");
  if (!nameEn) redirect("/system/catalog/new?error=name");
  if (!(await categorySlugs()).has(lineSlug)) redirect("/system/catalog/new?error=line");
  if (position && !POSITION_OPTIONS.includes(position)) redirect("/system/catalog/new?error=position");
  if (products.some((p) => p.code === code)) redirect("/system/catalog/new?error=exists");
  const custom = await fetchCustomProductsUncached();
  if (custom[code]) redirect("/system/catalog/new?error=exists");

  // Optional main picture.
  let image = "";
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) redirect("/system/catalog/new?error=notimage");
    if (file.size > 8 * 1024 * 1024) redirect("/system/catalog/new?error=toobig");
    const blob = await put(mediaPath(code, "gallery", `main-${file.name}`), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      abortSignal: AbortSignal.timeout(30000),
    });
    image = blob.url;
  }

  const record: CustomProductRecord = {
    code,
    nameEn,
    nameCs: nameCs || nameEn,
    lineSlug,
    descriptionEn,
    descriptionCs: descriptionCs || descriptionEn,
    position: position || "Unknown",
    image,
    createdAt: new Date().toISOString(),
  };
  custom[code] = record;
  await writeBlobJson(CUSTOM_PRODUCTS_BLOB_PATH, custom);

  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect(editorPath(productSlugFor(code, nameEn), "?saved=1"));
}

export async function deleteCustomProduct(formData: FormData) {
  await requireAdmin();
  const { code, custom } = await requireProduct(formData);
  if (!custom) redirect("/system/catalog"); // built-in machines can only be switched off

  const customProducts = await fetchCustomProductsUncached();
  delete customProducts[code];
  await writeBlobJson(CUSTOM_PRODUCTS_BLOB_PATH, customProducts);

  // Clean references: catalogue meta, XLSX overrides, group assignments.
  const meta = await fetchProductMetaUncached();
  if (meta[code]) {
    delete meta[code];
    await writeBlobJson(META_BLOB_PATH, meta);
  }
  const overrides = await fetchProductOverridesUncached();
  if (overrides[code]) {
    delete overrides[code];
    await writeBlobJson(PRODUCTS_BLOB_PATH, overrides);
  }
  const groups = await fetchProductGroupsUncached();
  let groupsChanged = false;
  for (const category of groups.categories) {
    for (const group of category.groups) {
      if (group.productCodes?.includes(code)) {
        group.productCodes = group.productCodes.filter((c) => c !== code);
        groupsChanged = true;
      }
    }
  }
  if (groupsChanged) await writeBlobJson(GROUPS_BLOB_PATH, groups);

  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect("/system/catalog?saved=1");
}

export async function deleteDocument(formData: FormData) {
  await requireAdmin();
  const { code, slug } = await requireProduct(formData);
  const url = String(formData.get("url") ?? "");
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  entry.documents = (entry.documents ?? []).filter((doc) => doc.url !== url);
  meta[code] = entry;
  await saveMeta(meta);
  try { await del(url); } catch { /* blob already gone — the reference is removed either way */ }
  redirect(editorPath(slug, "?saved=1"));
}
