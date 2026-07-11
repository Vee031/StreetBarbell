"use client";

import { useMemo, useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function ContactForm({ locale }: { locale: Locale }) {
  const cs = locale === "cs";
  const [form, setForm] = useState({ name: "", company: "", email: "", country: "", budget: "", area: "", message: "" });
  const body = useMemo(() => {
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
      <form className="contact-form" onSubmit={(event) => event.preventDefault()}>
        <div className="field-grid two-columns">
          <label><span>{cs ? "Jméno" : "Name"}</span><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder={cs ? "Vaše jméno" : "Your name"} /></label>
          <label><span>{cs ? "Společnost" : "Company"}</span><input value={form.company} onChange={(e) => update("company", e.target.value)} placeholder={cs ? "Název společnosti" : "Company name"} /></label>
          <label><span>E-mail</span><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@company.com" /></label>
          <label><span>{cs ? "Země" : "Country"}</span><input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder={cs ? "Česká republika" : "Czech Republic"} /></label>
          <label><span>{cs ? "Přibližný rozpočet" : "Approximate budget"}</span><input value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="250,000 CZK / 10,000 EUR" /></label>
          <label><span>{cs ? "Dostupná plocha" : "Available area"}</span><input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="110 m²" /></label>
        </div>
        <label><span>{cs ? "Popis projektu" : "Project description"}</span><textarea rows={6} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder={cs ? "Lokalita, cílová skupina, požadovaný termín…" : "Location, target group, desired timeline…"} /></label>
        <div className="form-actions">
          <a className="button button-red" href={`mailto:export@rvl13.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}><Mail size={18} /> {cs ? "Odeslat e-mailem" : "Send by email"}</a>
          <a className="button button-dark" target="_blank" rel="noreferrer" href={`https://wa.me/420721443652?text=${encodeURIComponent(`${subject}\n\n${body}`)}`}><MessageCircle size={18} /> WhatsApp</a>
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
