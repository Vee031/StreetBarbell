"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Mail, MessageCircle, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { submitInquiry } from "@/app/[locale]/contact/actions";

type Props = { locale: Locale; initialMessage?: string; sent?: boolean; error?: string };

export function ContactForm({ locale, initialMessage = "", sent = false, error }: Props) {
  const cs = locale === "cs";
  const [form, setForm] = useState({ name: "", company: "", email: "", country: "", budget: "", area: "", message: initialMessage });
  const whatsappBody = useMemo(() => {
    const labels = cs
      ? ["Jméno", "Společnost", "E-mail", "Země", "Rozpočet", "Dostupná plocha", "Zpráva"]
      : ["Name", "Company", "Email", "Country", "Budget", "Available area", "Message"];
    return [form.name, form.company, form.email, form.country, form.budget, form.area, form.message]
      .map((value, i) => `${labels[i]}: ${value || "—"}`).join("\n");
  }, [form, cs]);

  const subject = cs ? "Poptávka Street Barbell" : "Street Barbell project enquiry";
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="contact-form-shell">
      <form className="contact-form" action={submitInquiry}>
        <input type="hidden" name="locale" value={locale} />
        {/* Honeypot — hidden from people, tempting for bots. */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />

        {sent && (
          <p className="form-banner form-sent"><CheckCircle2 size={18} /> {cs ? "Děkujeme! Poptávka byla odeslána — ozveme se co nejdříve." : "Thank you! Your inquiry was sent — we will get back to you as soon as possible."}</p>
        )}
        {error === "empty" && <p className="form-banner form-error">{cs ? "Vyplňte prosím alespoň e-mail nebo zprávu." : "Please fill in at least your e-mail or a message."}</p>}
        {error === "storage" && <p className="form-banner form-error">{cs ? "Odeslání se nepodařilo — zkuste to prosím za chvíli, nebo použijte WhatsApp." : "Sending failed — please try again in a moment, or use WhatsApp."}</p>}

        <div className="field-grid two-columns">
          <label><span>{cs ? "Jméno" : "Name"}</span><input name="name" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={cs ? "Vaše jméno" : "Your name"} /></label>
          <label><span>{cs ? "Společnost" : "Company"}</span><input name="company" value={form.company} onChange={(e) => update("company", e.target.value)} placeholder={cs ? "Název společnosti" : "Company name"} /></label>
          <label><span>E-mail</span><input type="email" name="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.com" /></label>
          <label><span>{cs ? "Země" : "Country"}</span><input name="country" value={form.country} onChange={(e) => update("country", e.target.value)} placeholder={cs ? "Česká republika" : "Czech Republic"} /></label>
          <label><span>{cs ? "Přibližný rozpočet" : "Approximate budget"}</span><input name="budget" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="250,000 CZK / 10,000 EUR" /></label>
          <label><span>{cs ? "Dostupná plocha" : "Available area"}</span><input name="area" value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="110 m²" /></label>
        </div>
        <label><span>{cs ? "Popis projektu" : "Project description"}</span><textarea rows={6} name="message" value={form.message} onChange={(e) => update("message", e.target.value)} placeholder={cs ? "Lokalita, cílová skupina, požadovaný termín…" : "Location, target group, desired timeline…"} /></label>
        <div className="form-actions">
          <button className="button button-red" type="submit"><Send size={18} /> {cs ? "Odeslat poptávku" : "Send inquiry"}</button>
          <a className="button button-dark" target="_blank" rel="noreferrer" href={`https://wa.me/420721443652?text=${encodeURIComponent(`${subject}\n\n${whatsappBody}`)}`}><MessageCircle size={18} /> WhatsApp</a>
        </div>
      </form>
      <aside className="contact-aside">
        <span className="eyebrow">Street Barbell / RVL13</span>
        <h2>{cs ? "Přímý kontakt" : "Direct contact"}</h2>
        <a href="mailto:export@rvl13.com"><Mail /> <span><small>E-mail</small><strong>export@rvl13.com</strong></span></a>
        <a href="https://wa.me/420721443652" target="_blank" rel="noreferrer"><MessageCircle /> <span><small>WhatsApp</small><strong>+420 721 443 652</strong></span></a>
        <div className="contact-note"><Send size={20} /><p>{cs ? "Přiložte situační plán, fotografie místa nebo rozměry. Urychlí to přípravu konkrétního návrhu." : "Attach a site plan, location photos or dimensions. It will speed up preparation of a concrete proposal."}</p></div>
      </aside>
    </div>
  );
}
