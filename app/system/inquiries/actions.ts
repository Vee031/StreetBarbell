"use server";

import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { deleteInquiry, INQUIRIES_PREFIX } from "@/lib/inquiries";

export async function removeInquiry(formData: FormData) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const url = String(formData.get("url") ?? "");
  // Only inquiry blobs may be deleted through this action.
  if (!url.includes(`/${INQUIRIES_PREFIX}`)) redirect("/system/inquiries");
  try {
    await deleteInquiry(url);
  } catch {
    redirect("/system/inquiries?error=storage");
  }
  redirect("/system/inquiries?removed=1");
}
