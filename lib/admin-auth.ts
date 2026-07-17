import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "streetbarbell_admin";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function expectedAdminToken() {
  const secret = process.env.STREETBARBELL_APP_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update("streetbarbell-admin-access-v1").digest("hex");
}

export function isAdminPasswordValid(password: string) {
  const expectedPassword = process.env.STREETBARBELL_ADMIN_PASSWORD;
  return Boolean(expectedPassword && password && safeEqual(password.trim(), expectedPassword));
}

export function getAdminAccessToken() {
  return expectedAdminToken();
}

export async function isAdminAuthenticated() {
  const expectedToken = expectedAdminToken();
  if (!expectedToken) return false;
  const store = await cookies();
  const suppliedToken = store.get(ADMIN_COOKIE)?.value;
  return Boolean(suppliedToken && safeEqual(suppliedToken, expectedToken));
}
