import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getProducts, productColumns } from "@/lib/products-store";
import { getEffectivePricelist } from "@/lib/server-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }
  const [products, pricelist] = await Promise.all([getProducts(), getEffectivePricelist()]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.columns = [
    { header: "Code", key: "code", width: 13 },
    ...productColumns.map((col) => ({ header: col.header, key: col.key, width: col.type === "text" ? 30 : 15 })),
  ];
  for (const product of products) {
    const row: Record<string, string | number | null> = { code: product.code };
    for (const col of productColumns) {
      row[col.key] = col.key === "priceCzk" ? pricelist[product.code] ?? null : col.get(product);
    }
    sheet.addRow(row);
  }
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];

  const info = workbook.addWorksheet("How to use");
  info.getColumn(1).width = 110;
  [
    "Street Barbell — bulk product update",
    "",
    "1. Edit any cells in the 'Products' sheet. The Code column identifies the machine — never change it.",
    "2. Upload the file back at streetbarbell.cz/system/products. Changes go live within seconds.",
    "3. An EMPTY cell means: use the original built-in value (that is also how you undo an earlier change).",
    "4. Price CZK excl. VAT drives the configurator. Number columns must contain plain numbers.",
    "5. Do not add or delete rows — this file updates existing machines only.",
    "",
    `Exported ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC from streetbarbell.cz`,
  ].forEach((line) => info.addRow([line]));
  info.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="street-barbell-products-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
