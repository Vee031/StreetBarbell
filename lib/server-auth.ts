import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "streetbarbell_distributor";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function expectedAccessToken() {
  const secret = process.env.STREETBARBELL_APP_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update("streetbarbell-distributor-access-v1").digest("hex");
}

export function isDistributorCodeValid(code: string) {
  const expectedCode = process.env.STREETBARBELL_DISTRIBUTOR_CODE;
  return Boolean(expectedCode && code && safeEqual(code.trim(), expectedCode));
}

export function getDistributorAccessToken() {
  return expectedAccessToken();
}

export async function isDistributorAuthenticated() {
  const expectedToken = expectedAccessToken();
  if (!expectedToken) return false;
  const store = await cookies();
  const suppliedToken = store.get(ACCESS_COOKIE)?.value;
  return Boolean(suppliedToken && safeEqual(suppliedToken, expectedToken));
}
