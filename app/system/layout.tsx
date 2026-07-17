import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Site management — streetbarbell.cz",
  robots: { index: false, follow: false },
};

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return <div className="sys-root">{children}</div>;
}
