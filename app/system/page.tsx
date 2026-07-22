import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSpreadsheet, LayoutList, ListTree, PencilLine, Users } from "lucide-react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { SystemNav } from "@/components/system-nav";
import { fetchProductMetaUncached, isEnabled } from "@/lib/product-meta";
import { fetchProductGroupsUncached } from "@/lib/product-groups";
import { fetchCustomProductsUncached, fetchImportReport } from "@/lib/products-store";
import { products as baseProducts } from "@/lib/data";
import { fetchTeamUsers } from "@/lib/team-users";
import { fetchOverridesUncached } from "@/lib/site-texts";

export const dynamic = "force-dynamic";

export default async function SystemDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const [meta, groups, custom, report, teamUsers, textOverrides] = await Promise.all([
    fetchProductMetaUncached().catch(() => ({})),
    fetchProductGroupsUncached().catch(() => ({ categories: [] })),
    fetchCustomProductsUncached().catch(() => ({})),
    fetchImportReport().catch(() => null),
    fetchTeamUsers().catch(() => ({})),
    fetchOverridesUncached().catch(() => ({}) as Awaited<ReturnType<typeof fetchOverridesUncached>>),
  ]);

  const customCount = Object.keys(custom).length;
  const totalProducts = baseProducts.length + customCount;
  const allCodes = [...baseProducts.map((p) => p.code), ...Object.keys(custom)];
  const offCount = allCodes.filter((code) => !isEnabled(meta, code)).length;
  const groupCount = groups.categories.reduce((n, c) => n + c.groups.length, 0);
  const teamCount = Object.keys(teamUsers).length;
  const editedTexts = (["en", "cs"] as const).reduce(
    (n, locale) => n + Object.values(textOverrides[locale] ?? {}).reduce((m, section) => m + Object.keys(section).length, 0),
    0,
  );
  const lastImport = report ? new Date(report.at).toLocaleDateString("en-GB") : null;

  return (
    <>
      <SystemNav active="dashboard" />
      <div className="sys-shell">
        <header className="sys-header">
          <div>
            <h1>Dashboard</h1>
            <p>Management of streetbarbell.cz — pick a section. Everything you save is live on the website within seconds.</p>
          </div>
        </header>

        <div className="dash-grid">
          <Link href="/system/groups" className="dash-tile">
            <ListTree size={26} />
            <strong>Website management</strong>
            <p>Menu &amp; pages as a tree: categories, product groups, links, status and order.</p>
            <span className="dash-stat"><em>{groups.categories.length}</em> categor{groups.categories.length === 1 ? "y" : "ies"} · <em>{groupCount}</em> group(s)</span>
          </Link>
          <Link href="/system/catalog" className="dash-tile">
            <LayoutList size={26} />
            <strong>Catalogue</strong>
            <p>All products including combinations: category, position, photos, documents, video, muscles, on/off.</p>
            <span className="dash-stat"><em>{totalProducts}</em> products · <em>{customCount}</em> custom · <em>{offCount}</em> switched off</span>
          </Link>
          <Link href="/system/texts" className="dash-tile">
            <PencilLine size={26} />
            <strong>Site texts</strong>
            <p>Every heading, label and paragraph on the website, editable in EN and CZ side by side.</p>
            <span className="dash-stat"><em>{editedTexts}</em> text(s) customized</span>
          </Link>
          <Link href="/system/products" className="dash-tile">
            <FileSpreadsheet size={26} />
            <strong>Products import</strong>
            <p>Download the products.xlsx, edit prices, names or specs in bulk, upload back.</p>
            <span className="dash-stat">{lastImport ? <>last import <em>{lastImport}</em></> : "no import yet"}</span>
          </Link>
          <Link href="/system/users" className="dash-tile">
            <Users size={26} />
            <strong>Team members</strong>
            <p>People who see real prices in the configurator after signing in.</p>
            <span className="dash-stat"><em>{teamCount}</em> member(s)</span>
          </Link>
        </div>
      </div>
    </>
  );
}
