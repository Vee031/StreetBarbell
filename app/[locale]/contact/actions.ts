"use server";

import { redirect } from "next/navigation";
import { saveInquiry } from "@/lib/inquiries";
import { sendInquiryEmail } from "@/lib/notify";

const clip = (value: FormDataEntryValue | null, max: number) => String(value ?? "").trim().slice(0, max);

// Public action: submits the contact/quote form into the admin inquiries inbox
// (/system/inquiries). No mail client needed — this was the reason the old
// mailto: buttons "did nothing" on machines without a default e-mail app.
export async function submitInquiry(formData: FormData) {
  const locale = clip(formData.get("locale"), 2) === "cs" ? "cs" : "en";
  // Honeypot: real visitors never fill this hidden field. Bots that do get a
  // fake success and nothing is stored.
  if (clip(formData.get("website"), 10)) redirect(`/${locale}/contact?sent=1`);

  const inquiry = {
    at: new Date().toISOString(),
    locale,
    name: clip(formData.get("name"), 120),
    company: clip(formData.get("company"), 120),
    email: clip(formData.get("email"), 160),
    country: clip(formData.get("country"), 80),
    budget: clip(formData.get("budget"), 80),
    area: clip(formData.get("area"), 80),
    message: clip(formData.get("message"), 4000),
  } as const;

  // At least a way to reach back plus some content.
  if (!inquiry.email && !inquiry.message) redirect(`/${locale}/contact?error=empty`);

  try {
    await saveInquiry(inquiry);
  } catch {
    redirect(`/${locale}/contact?error=storage`);
  }
  // Instant e-mail heads-up (Resend); failure is non-fatal — the inbox has it.
  await sendInquiryEmail(inquiry);
  redirect(`/${locale}/contact?sent=1`);
}
