import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { login } from "./actions";

export default async function SystemLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/system");
  const { error } = await searchParams;
  return (
    <div className="sys-login">
      <form action={login} className="sys-login-card">
        <div className="brand"><span className="brand-mark">SB</span><span className="brand-word"><strong>STREET</strong> BARBELL</span></div>
        <h1>Site management</h1>
        <p>Sign in to edit the texts on streetbarbell.cz.</p>
        {error ? <p className="sys-error">Wrong password. Please try again.</p> : null}
        <input type="password" name="password" placeholder="Admin password" required autoFocus autoComplete="current-password" />
        <button type="submit" className="button button-red">Sign in</button>
      </form>
    </div>
  );
}
