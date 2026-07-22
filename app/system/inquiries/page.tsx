import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SystemNav } from "@/components/system-nav";
import { listInquiries } from "@/lib/inquiries";
import { removeInquiry } from "./actions";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default async function SystemInquiriesPage({ searchParams }: { searchParams: Promise<{ removed?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { removed, error } = await searchParams;
  const inquiries = await listInquiries();

  return (
    <>
    <SystemNav active="inquiries" />
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <h1>Inquiries</h1>
          <p>Everything sent through the website&apos;s contact / quote forms — the configurator&apos;s &quot;Nezávazná poptávka&quot; and product-page quote buttons land here too. Reply from your own e-mail; delete when handled.</p>
        </div>
      </header>

      {error === "storage" ? <p className="sys-banner sys-error">Storage is not reachable — try again in a moment.</p> : null}
      {removed ? <p className="sys-banner sys-saved">Inquiry deleted.</p> : null}

      {inquiries.length === 0 ? (
        <p className="sys-note">No inquiries yet. They will appear here the moment a visitor submits the contact form.</p>
      ) : (
        inquiries.map((inquiry) => (
          <section className="sys-card" key={inquiry.url}>
            <div className="sys-card-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
              <div>
                <h2 style={{ marginBottom: 2 }}>{inquiry.name || inquiry.email || "Anonymous"}{inquiry.company ? ` — ${inquiry.company}` : ""}</h2>
                <p style={{ margin: 0 }}>
                  {formatDate(inquiry.at)} · {inquiry.locale.toUpperCase()}
                  {inquiry.email ? <> · <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></> : null}
                </p>
              </div>
              <form action={removeInquiry}>
                <input type="hidden" name="url" value={inquiry.url} />
                <button type="submit">Delete</button>
              </form>
            </div>
            <div className="inq-meta">
              {inquiry.country && <span><small>Country</small><strong>{inquiry.country}</strong></span>}
              {inquiry.budget && <span><small>Budget</small><strong>{inquiry.budget}</strong></span>}
              {inquiry.area && <span><small>Area</small><strong>{inquiry.area}</strong></span>}
            </div>
            {inquiry.message && <pre className="inq-message">{inquiry.message}</pre>}
          </section>
        ))
      )}
    </div>
    </>
  );
}
