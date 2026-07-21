"use server";

import { del, put } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { writeBlobJson } from "@/lib/blob-json";
import { products } from "@/lib/data";
import { MUSCLE_SHAPES } from "@/lib/muscle-figure";
import { fetchProductMetaUncached, META_BLOB_PATH, youtubeVideoId, type ProductMetaMap } from "@/lib/product-meta";
import { PRODUCTS_CACHE_TAG } from "@/lib/products-store";

const codeSet = new Set(products.map((product) => product.code));
const slugByCode = new Map(products.map((product) => [product.code, product.slug]));

function mediaPath(code: string, kind: "gallery" | "docs", fileName: string) {
  const safeCode = code.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const safeName = fileName.replace(/[^a-z0-9._-]+/gi, "_").slice(-80);
  return `products-media/${safeCode}/${kind}/${Date.now()}-${safeName}`;
}

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/system/catalog?error=storage");
}

function editorPath(code: string, suffix = "") {
  return `/system/catalog/${slugByCode.get(code)}${suffix}`;
}

async function saveMeta(meta: ProductMetaMap) {
  await writeBlobJson(META_BLOB_PATH, meta);
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
}

function requireCode(formData: FormData): string {
  const code = String(formData.get("code") ?? "").trim();
  if (!codeSet.has(code)) redirect("/system/catalog");
  return code;
}

export async function toggleProduct(formData: FormData) {
  await requireAdmin();
  const code = requireCode(formData);
  const enable = String(formData.get("enable")) === "true";
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  if (enable) delete entry.enabled;
  else entry.enabled = false;
  meta[code] = entry;
  await saveMeta(meta);
  redirect(editorPath(code, "?saved=1"));
}

export async function saveVideoAndMuscles(formData: FormData) {
  await requireAdmin();
  const code = requireCode(formData);
  const youtubeUrl = String(formData.get("youtubeUrl") ?? "").trim();
  if (youtubeUrl && !youtubeVideoId(youtubeUrl)) redirect(editorPath(code, "?error=youtube"));
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
  redirect(editorPath(code, "?saved=1"));
}

export async function uploadGalleryImages(formData: FormData) {
  await requireAdmin();
  const code = requireCode(formData);
  const files = formData.getAll("images").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) redirect(editorPath(code, "?error=nofile"));
  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) redirect(editorPath(code, "?error=notimage"));
    if (file.size > 8 * 1024 * 1024) redirect(editorPath(code, "?error=toobig"));
    const blob = await put(mediaPath(code, "gallery", file.name), file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
      abortSignal: AbortSignal.timeout(30000),
    });
    urls.push(blob.url);
  }
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  entry.gallery = [...(entry.gallery ?? []), ...urls];
  meta[code] = entry;
  await saveMeta(meta);
  redirect(editorPath(code, "?saved=1"));
}

export async function deleteGalleryImage(formData: FormData) {
  await requireAdmin();
  const code = requireCode(formData);
  const url = String(formData.get("url") ?? "");
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  entry.gallery = (entry.gallery ?? []).filter((item) => item !== url);
  meta[code] = entry;
  await saveMeta(meta);
  try { await del(url); } catch { /* blob already gone — the reference is removed either way */ }
  redirect(editorPath(code, "?saved=1"));
}

export async function uploadDocument(formData: FormData) {
  await requireAdmin();
  const code = requireCode(formData);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(editorPath(code, "?error=nofile"));
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) redirect(editorPath(code, "?error=notpdf"));
  if (file.size > 25 * 1024 * 1024) redirect(editorPath(code, "?error=toobig"));
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
  redirect(editorPath(code, "?saved=1"));
}

export async function deleteDocument(formData: FormData) {
  await requireAdmin();
  const code = requireCode(formData);
  const url = String(formData.get("url") ?? "");
  const meta = await fetchProductMetaUncached();
  const entry = { ...(meta[code] ?? {}) };
  entry.documents = (entry.documents ?? []).filter((doc) => doc.url !== url);
  meta[code] = entry;
  await saveMeta(meta);
  try { await del(url); } catch { /* blob already gone — the reference is removed either way */ }
  redirect(editorPath(code, "?saved=1"));
}
