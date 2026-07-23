import type { Inquiry } from "./inquiries";

// E-mail notification for new inquiries, sent through Resend.
// - RESEND_API_KEY: the Resend API key.
// - INQUIRY_NOTIFY_TO: recipient. Until a domain is verified at
//   resend.com/domains, Resend only delivers to the account owner's address;
//   after verification, switch this env var to export@rvl13.com and change
//   FROM below to an address on the verified domain.
// Failures are swallowed — the /system/inquiries inbox is the reliable record,
// the e-mail is only an instant heads-up.
const FROM = "Street Barbell <onboarding@resend.dev>";

export async function sendInquiryEmail(inquiry: Inquiry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_NOTIFY_TO;
  if (!apiKey || !to) return;

  const cs = inquiry.locale === "cs";
  const lines = [
    `${cs ? "Jméno" : "Name"}: ${inquiry.name || "—"}`,
    `${cs ? "Společnost" : "Company"}: ${inquiry.company || "—"}`,
    `E-mail: ${inquiry.email || "—"}`,
    `${cs ? "Země" : "Country"}: ${inquiry.country || "—"}`,
    `${cs ? "Rozpočet" : "Budget"}: ${inquiry.budget || "—"}`,
    `${cs ? "Plocha" : "Area"}: ${inquiry.area || "—"}`,
    "",
    inquiry.message || "—",
    "",
    "—",
    "streetbarbell.cz/system/inquiries",
  ].join("\n");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        ...(inquiry.email ? { reply_to: inquiry.email } : {}),
        subject: `${cs ? "Nová poptávka ze streetbarbell.cz" : "New inquiry from streetbarbell.cz"} — ${inquiry.name || inquiry.email || (cs ? "anonym" : "anonymous")}`,
        text: lines,
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // Ignore — the inquiry is already stored in the admin inbox.
  }
}
