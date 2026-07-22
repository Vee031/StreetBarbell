"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TEAM_COOKIE, TEAM_COOKIE_MAX_AGE, makeTeamToken } from "@/lib/team-auth";
import { verifyLogin } from "@/lib/team-users";

export async function teamLogin(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en") === "cs" ? "cs" : "en";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!(await verifyLogin(email, password))) {
    redirect(`/${locale}/team-login?error=1`);
  }
  const store = await cookies();
  store.set(TEAM_COOKIE, makeTeamToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TEAM_COOKIE_MAX_AGE,
  });
  redirect(`/${locale}/configurations`);
}

export async function teamLogout(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en") === "cs" ? "cs" : "en";
  const store = await cookies();
  store.delete(TEAM_COOKIE);
  redirect(`/${locale}/configurations`);
}
