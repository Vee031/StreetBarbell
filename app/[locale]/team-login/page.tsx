import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogIn } from "lucide-react";
import { isLocale, type Locale } from "@/lib/i18n";
import { getTeamMember } from "@/lib/team-auth";
import { teamLogin } from "./actions";

export const dynamic = "force-dynamic";

export default async function TeamLoginPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) redirect("/en/team-login");
  const locale = rawLocale as Locale;
  const cs = locale === "cs";
  const { error } = await searchParams;
  const member = await getTeamMember();

  if (member) {
    return (
      <section className="team-login-wrap">
        <div className="config-access">
          <div className="access-icon"><LogIn size={26} /></div>
          <span className="eyebrow">Street Barbell</span>
          <h2>{cs ? "Jste přihlášeni" : "You are signed in"}</h2>
          <p>{cs ? `Přihlášen(a) jako ${member}. V konfigurátoru se zobrazují reálné ceny.` : `Signed in as ${member}. Real prices are shown in the configurator.`}</p>
          <Link className="button button-red" href={`/${locale}/configurations`}>{cs ? "Zpět do konfigurátoru" : "Back to the configurator"} <ArrowRight size={18} /></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="team-login-wrap">
      <form className="config-access" action={teamLogin}>
        <input type="hidden" name="locale" value={locale} />
        <div className="access-icon"><LogIn size={26} /></div>
        <span className="eyebrow">Street Barbell Team</span>
        <h2>{cs ? "Přihlášení týmu" : "Team sign in"}</h2>
        <p>{cs ? "Přihlaste se firemním e-mailem. Po přihlášení uvidíte v konfigurátoru reálné ceny." : "Sign in with your company e-mail. Once signed in, the configurator shows real prices."}</p>
        <input type="email" name="email" placeholder={cs ? "Firemní e-mail" : "Company e-mail"} autoComplete="username" required />
        <input type="password" name="password" placeholder={cs ? "Heslo" : "Password"} autoComplete="current-password" required />
        <button className="button button-red" type="submit">{cs ? "Přihlásit se" : "Sign in"} <ArrowRight size={18} /></button>
        {error && <p className="access-error">{cs ? "Nesprávný e-mail nebo heslo." : "Wrong e-mail or password."}</p>}
        <small>{cs ? "Přístup poskytuje administrátor RVL13." : "Access is provided by the RVL13 administrator."}</small>
      </form>
    </section>
  );
}
