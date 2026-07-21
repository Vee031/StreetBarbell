import { NextResponse } from "next/server";

// The Czech National Bank publishes one official CZK rate per currency per day
// (the declared mid rate). Format is a semicolon table; the EUR row looks like:
//   EMU|euro|1|EUR|25,035
const CNB_URL =
  "https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt";
const FALLBACK_RATE = 25;

export const revalidate = 43200; // 12 h — CNB updates once per working day

function parseEurRate(text: string): number | null {
  for (const line of text.split(/\r?\n/)) {
    const cols = line.split("|");
    if (cols[3] === "EUR" && cols[2] && cols[4]) {
      const amount = Number(cols[2].replace(",", "."));
      const rate = Number(cols[4].replace(",", "."));
      if (Number.isFinite(amount) && Number.isFinite(rate) && amount > 0) {
        return rate / amount; // CZK per 1 EUR
      }
    }
  }
  return null;
}

export async function GET() {
  try {
    const response = await fetch(CNB_URL, {
      next: { revalidate },
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const rate = parseEurRate(await response.text());
      if (rate) return NextResponse.json({ rate: Math.round(rate * 1000) / 1000, source: "cnb" });
    }
  } catch {
    // fall through to the fallback below
  }
  return NextResponse.json({ rate: FALLBACK_RATE, source: "fallback" });
}
