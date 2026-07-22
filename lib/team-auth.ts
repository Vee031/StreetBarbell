import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// A team session: a signed cookie carrying the member's email. Proves the person
// logged in with valid credentials; used to decide whether the configurator shows
// real prices. Signature-only check (no blob read per request).
export const TEAM_COOKIE = "streetbarbell_team";
export const TEAM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(email: string): string {
  const secret = process.env.STREETBARBELL_APP_SECRET ?? "";
  return createHmac("sha256", secret).update(`team-session:${email.toLowerCase()}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function makeTeamToken(email: string): string {
  return `${Buffer.from(email.toLowerCase()).toString("base64url")}.${sign(email)}`;
}

export async function getTeamMember(): Promise<string | null> {
  const token = (await cookies()).get(TEAM_COOKIE)?.value;
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString();
  } catch {
    return null;
  }
  return safeEqual(signature, sign(email)) ? email : null;
}

export async function isTeamMember(): Promise<boolean> {
  return (await getTeamMember()) !== null;
}
