import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS_COOKIE, getDistributorAccessToken, isDistributorAuthenticated, isDistributorCodeValid } from "@/lib/server-auth";

export async function GET() {
  return NextResponse.json({ authenticated: await isDistributorAuthenticated() });
}

export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };
  const token = getDistributorAccessToken();
  if (!process.env.STREETBARBELL_DISTRIBUTOR_CODE || !token) {
    return NextResponse.json({ error: "Access is not configured." }, { status: 503 });
  }
  if (!code || !isDistributorCodeValid(code)) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }
  const store = await cookies();
  store.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.json({ authenticated: true });
}

export async function DELETE() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  return NextResponse.json({ authenticated: false });
}
