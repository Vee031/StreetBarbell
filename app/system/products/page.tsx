import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { fetchImportReport, fetchProductOverridesUncached, productColumns } from "@/lib/products-store";
import { importProducts } from "./actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  storage: "Storage is not reachable — nothing was saved. Try again in a minute.",
  nofile: "No file was selected.",
  toobig: "The file is larger than 8 MB — that is not the products file.",
  notxlsx: "The file could not be read as an Excel (.xlsx) workbook.",
  nosheet: "The workbook contains no worksheet.",
  nocode: "The first row must contain a \"Code\" column header.",
};

export default async function SystemProductsPage({ searchParams }: { searchParams: Promise<{ done?: string; failed?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { done, failed, error } = await searchParams;
  const storageReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const [report, overrides] = await Promise.all([fetchImportReport(), fetchProductOverridesUncached()]);
  const overriddenProducts = Object.keys(overrides).length;

  return (
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <h1>Products import</h1>
          <p>Update all 116 machines at once — price, descriptions, specifications — from one Excel file.</p>
        </div>
        <div className="sys-header-actions">
          <Link href="/system">← Site texts</Link>
          <Link href="/system/catalog">Catalogue →</Link>
        </div>
      </header>

      {!storageReady ? <p className="sys-banner sys-error">Storage is not configured (missing BLOB_READ_WRITE_TOKEN) — uploads cannot be saved.</p> : null}
      {error && ERROR_MESSAGES[error] ? <p className="sys-banner sys-error">{ERROR_MESSAGES[error]}</p> : null}
      {failed ? <p className="sys-banner sys-error">The file was checked but NOT applied — fix the errors listed below and upload again.</p> : null}
      {done ? <p className="sys-banner sys-saved">Import applied — the site and configurator now use the uploaded data. It can take a few seconds to appear.</p> : null}

      <section className="sys-card">
        <div className="sys-card-head">
          <h2>1 — Download the current products file</h2>
          <p>The file always contains the live data, including every change from previous uploads.</p>
        </div>
        <Link className="button button-dark button-small" href="/system/products/template" prefetch={false} download>Download products.xlsx</Link>
      </section>

      <section className="sys-card">
        <div className="sys-card-head">
          <h2>2 — Edit in Excel, then upload</h2>
          <p>
            Edit any cells except the Code column. An empty cell reverts to the original built-in value.
            Editable columns: {productColumns.map((c) => c.header).join(", ")}.
          </p>
        </div>
        <form action={importProducts} className="sys-upload-row">
          <input type="file" name="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required />
          <button type="submit" className="button button-red button-small" disabled={!storageReady}>Upload &amp; apply</button>
        </form>
        <p className="sys-note">
          {overriddenProducts > 0
            ? `Currently ${overriddenProducts} machine(s) carry uploaded values; everything else uses the built-in data.`
            : "No uploaded values yet — the site currently uses the built-in data everywhere."}
        </p>
      </section>

      {report ? (
        <section className="sys-card">
          <div className="sys-card-head">
            <h2>Last import</h2>
            <p>
              {new Date(report.at).toLocaleString("en-GB")} — “{report.fileName}” — {report.rowsRead} rows read,{" "}
              {report.productsChanged} machine(s) changed, {report.fieldsOverridden} field(s) overridden
              {report.errors.length > 0 ? `, ${report.errors.length} error(s)` : ", no errors"}.
            </p>
          </div>
          {report.errors.length > 0 ? (
            <ul className="sys-error-list">
              {report.errors.map((message) => <li key={message}>{message}</li>)}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
