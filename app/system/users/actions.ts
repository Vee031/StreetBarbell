"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isValidEmail, removeUser, upsertUser } from "@/lib/team-users";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  if (!process.env.BLOB_READ_WRITE_TOKEN) redirect("/system/users?error=storage");
}

export async function addTeamUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!isValidEmail(email)) redirect("/system/users?error=email");
  if (password.length < 6) redirect("/system/users?error=password");
  try {
    await upsertUser(email, password);
  } catch {
    redirect("/system/users?error=storage");
  }
  revalidatePath("/system/users");
  redirect("/system/users?saved=1");
}

export async function deleteTeamUser(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  try {
    await removeUser(email);
  } catch {
    redirect("/system/users?error=storage");
  }
  revalidatePath("/system/users");
  redirect("/system/users?removed=1");
}
