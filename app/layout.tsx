import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Street Barbell", template: "%s | Street Barbell" },
  description: "Professional outdoor fitness equipment and intelligent configuration tools for distributors and public-space projects.",
  metadataBase: new URL("https://streetbarbell.cz"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
