import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { logout } from "@/app/system/login/actions";

// Permanent admin top bar, styled after the owner's RVL13 management system:
// brand block on the left, big tab buttons, user block + sign-out on the right.
export type SystemTab = "dashboard" | "texts" | "groups" | "catalog" | "products" | "users";

const TABS: { id: SystemTab; href: string; label: string }[] = [
  { id: "dashboard", href: "/system", label: "Dashboard" },
  { id: "texts", href: "/system/texts", label: "Site texts" },
  { id: "groups", href: "/system/groups", label: "Website management" },
  { id: "catalog", href: "/system/catalog", label: "Catalogue" },
  { id: "products", href: "/system/products", label: "Products import" },
  { id: "users", href: "/system/users", label: "Team members" },
];

export function SystemNav({ active }: { active: SystemTab }) {
  return (
    <div className="sysnav">
      <div className="sysnav-inner">
        <Link href="/system" className="sysnav-brand">
          <strong>STREET</strong> BARBELL<span>.cz</span>
        </Link>
        <nav className="sysnav-tabs" aria-label="Admin sections">
          {TABS.map((tab) => (
            <Link key={tab.id} href={tab.href} className={tab.id === active ? "sysnav-tab is-active" : "sysnav-tab"}>
              {tab.label}
            </Link>
          ))}
          <a className="sysnav-tab sysnav-external" href="/en" target="_blank" rel="noreferrer">
            Open website <ExternalLink size={13} />
          </a>
        </nav>
        <div className="sysnav-user">
          <div className="sysnav-user-name">
            <strong>Admin</strong>
            <small>Administrátor</small>
          </div>
          <form action={logout}>
            <button type="submit" title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
