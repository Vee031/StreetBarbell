import { NextResponse, type NextRequest } from "next/server";

// Geo-aware entry: streetbarbell.cz/ redirects Czech visitors to /cs and
// everyone else to /en (owner request 2026-07-23). Vercel sets the visitor's
// country on every request as the x-vercel-ip-country header. When the header
// is missing (local dev, other hosts) the browser's Accept-Language decides.
// Only the bare root is intercepted — direct /en and /cs links, the language
// switcher and all other routes are untouched.
export function middleware(request: NextRequest) {
  const country = request.headers.get("x-vercel-ip-country");
  const wantsCzech = country
    ? country === "CZ"
    : /(^|,)\s*cs\b/i.test(request.headers.get("accept-language") ?? "");
  const response = NextResponse.redirect(new URL(wantsCzech ? "/cs" : "/en", request.url), 307);
  // Diagnostic: which country the edge reported (visible with curl -I).
  response.headers.set("x-detected-country", country ?? "none");
  return response;
}

export const config = { matcher: "/" };
