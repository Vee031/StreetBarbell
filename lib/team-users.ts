import { createHmac, timingSafeEqual } from "node:crypto";
import { readBlobJson, writeBlobJson } from "./blob-json";

// Team members (RVL13 staff) who can see real prices in the configurator. Stored
// in Vercel Blob with the password kept only as a keyed hash — the store is
// public-readable, so we never keep plaintext. Admins set/reset passwords; they
// cannot read an existing one back (by design).
export const TEAM_USERS_BLOB_PATH = "content/team-users.json";

export type TeamUser = { email: string; hash: string; createdAt: string };
export type TeamUsers = Record<string, TeamUser>; // key = lowercased email

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function hashPassword(email: string, password: string): string {
  const secret = process.env.STREETBARBELL_APP_SECRET ?? "";
  return createHmac("sha256", secret).update(`team-pw:${normalizeEmail(email)}:${password}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function fetchTeamUsers(): Promise<TeamUsers> {
  return (await readBlobJson<TeamUsers>(TEAM_USERS_BLOB_PATH)) ?? {};
}

export async function verifyLogin(email: string, password: string): Promise<boolean> {
  const users = await fetchTeamUsers();
  const user = users[normalizeEmail(email)];
  if (!user || !password) return false;
  return safeEqual(user.hash, hashPassword(email, password));
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function upsertUser(email: string, password: string): Promise<void> {
  const users = await fetchTeamUsers();
  const key = normalizeEmail(email);
  users[key] = { email: email.trim(), hash: hashPassword(email, password), createdAt: users[key]?.createdAt ?? new Date().toISOString() };
  await writeBlobJson(TEAM_USERS_BLOB_PATH, users);
}

export async function removeUser(email: string): Promise<void> {
  const users = await fetchTeamUsers();
  delete users[normalizeEmail(email)];
  await writeBlobJson(TEAM_USERS_BLOB_PATH, users);
}
