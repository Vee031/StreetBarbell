"use server";

import { put } from "@vercel/blob";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { dictionaries, locales } from "@/lib/i18n";
import { fetchOverridesUncached, TEXTS_BLOB_PATH, TEXTS_CACHE_TAG, type SectionKey } from "@/lib/site-texts";

export async function saveSection(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const section = String(formData.get("section") ?? "") as SectionKey;
  if (!(section in dictionaries.en)) redirect("/system");
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/system?error=storage");

  const overrides = await fetchOverridesUncached();
  for (const locale of locales) {
    const defaults = dictionaries[locale][section] as Record<string, string>;
    const sectionOverrides: Record<string, string> = {};
    for (const key of Object.keys(defaults)) {
      const raw = formData.get(`${locale}.${key}`);
      if (raw === null) continue;
      const value = String(raw).trim();
      // Only texts that differ from the built-in default are stored; an
      // emptied field therefore falls back to the original wording.
      if (value && value !== defaults[key]) sectionOverrides[key] = value;
    }
    const localeOverrides = { ...(overrides[locale] ?? {}) };
    if (Object.keys(sectionOverrides).length > 0) localeOverrides[section] = sectionOverrides;
    else delete localeOverrides[section];
    overrides[locale] = localeOverrides;
  }

  try {
    await put(TEXTS_BLOB_PATH, JSON.stringify(overrides, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      abortSignal: AbortSignal.timeout(10000),
    });
  } catch {
    redirect("/system?error=storage");
  }
  updateTag(TEXTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect(`/system?saved=${section}`);
}
