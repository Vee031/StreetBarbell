"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import ExcelJS from "exceljs";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { writeBlobJson } from "@/lib/blob-json";
import { products as baseProducts } from "@/lib/data";
import {
  productColumns,
  PRODUCTS_BLOB_PATH,
  PRODUCTS_CACHE_TAG,
  PRODUCTS_REPORT_BLOB_PATH,
  type ImportReport,
  type ProductOverride,
  type ProductOverrides,
} from "@/lib/products-store";
import { getPricelist } from "@/lib/server-pricing";

type CellValue = ExcelJS.CellValue;

function cellToRaw(value: CellValue): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined) return cellToRaw(value.result as CellValue);
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("hyperlink" in value && typeof value.hyperlink === "string") return value.hyperlink;
  }
  return String(value);
}

function toNumber(raw: string | number): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

async function saveReport(report: ImportReport) {
  await writeBlobJson(PRODUCTS_REPORT_BLOB_PATH, report);
}

export async function importProducts(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/system/products?error=storage");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/system/products?error=nofile");
  if (file.size > 8 * 1024 * 1024) redirect("/system/products?error=toobig");

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    redirect("/system/products?error=notxlsx");
  }
  const sheet = workbook.getWorksheet("Products") ?? workbook.worksheets[0];
  if (!sheet) redirect("/system/products?error=nosheet");

  // Map spreadsheet columns to known fields by header text.
  const headerRow = sheet.getRow(1);
  const colByIndex = new Map<number, (typeof productColumns)[number]>();
  let codeIndex = 0;
  headerRow.eachCell((cell, index) => {
    const header = String(cellToRaw(cell.value) ?? "").trim().toLowerCase();
    if (header === "code") codeIndex = index;
    const match = productColumns.find((col) => col.header.toLowerCase() === header);
    if (match) colByIndex.set(index, match);
  });
  if (!codeIndex) redirect("/system/products?error=nocode");

  const byCode = new Map(baseProducts.map((product) => [product.code, product]));
  const envPricelist = getPricelist();
  const overrides: ProductOverrides = {};
  const errors: string[] = [];
  let rowsRead = 0;
  let fieldsOverridden = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const code = String(cellToRaw(row.getCell(codeIndex).value) ?? "").trim();
    if (!code) return;
    rowsRead += 1;
    const product = byCode.get(code);
    if (!product) {
      errors.push(`Row ${rowNumber}: unknown product code "${code}".`);
      return;
    }
    const override: ProductOverride = {};
    for (const [index, col] of colByIndex.entries()) {
      const raw = cellToRaw(row.getCell(index).value);
      if (raw === null || (typeof raw === "string" && raw.trim() === "")) continue; // empty = built-in value
      const current = col.key === "priceCzk" ? envPricelist[code] ?? null : col.get(product);
      if (col.type === "number") {
        const n = toNumber(raw);
        if (n === null) {
          errors.push(`Row ${rowNumber} (${code}): "${col.header}" is not a number: "${raw}".`);
          continue;
        }
        if (n < 0) {
          errors.push(`Row ${rowNumber} (${code}): "${col.header}" cannot be negative.`);
          continue;
        }
        if (n !== current) override[col.key] = n;
      } else {
        const text = String(raw).trim();
        if (text !== ((current as string | null) ?? "")) override[col.key] = text;
      }
    }
    if (Object.keys(override).length > 0) {
      overrides[code] = override;
      fieldsOverridden += Object.keys(override).length;
    }
  });

  const report: ImportReport = {
    at: new Date().toISOString(),
    fileName: file.name,
    rowsRead,
    productsChanged: Object.keys(overrides).length,
    fieldsOverridden,
    errors: errors.slice(0, 50),
  };

  try {
    if (errors.length === 0) {
      // Atomic replace: this upload becomes the complete set of overrides.
      await writeBlobJson(PRODUCTS_BLOB_PATH, overrides);
    }
    await saveReport(report);
  } catch {
    redirect("/system/products?error=storage");
  }

  if (errors.length > 0) redirect("/system/products?failed=1");
  updateTag(PRODUCTS_CACHE_TAG);
  revalidatePath("/", "layout");
  redirect("/system/products?done=1");
}
