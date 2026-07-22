import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { fetchTeamUsers } from "@/lib/team-users";
import { addTeamUser, deleteTeamUser } from "./actions";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  storage: "Storage is not reachable — the change was not saved.",
  email: "Enter a valid e-mail address.",
  password: "Password must be at least 6 characters.",
};

export default async function SystemUsersPage({ searchParams }: { searchParams: Promise<{ saved?: string; removed?: string; error?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect("/system/login");
  const { saved, removed, error } = await searchParams;
  const users = Object.values(await fetchTeamUsers()).sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="sys-shell">
      <header className="sys-header">
        <div>
          <h1>Team members</h1>
          <p>People who can sign in to see real prices in the configurator. Everyone else uses it price-free.</p>
        </div>
        <div className="sys-header-actions">
          <Link href="/system">Site texts</Link>
          <Link href="/system/catalog">Catalogue</Link>
        </div>
      </header>

      {error && ERRORS[error] ? <p className="sys-banner sys-error">{ERRORS[error]}</p> : null}
      {saved ? <p className="sys-banner sys-saved">Saved. Send the password to the person yourself — it can’t be shown here again.</p> : null}
      {removed ? <p className="sys-banner sys-saved">Team member removed.</p> : null}

      <section className="sys-card">
        <div className="sys-card-head">
          <h2>Add / update a member</h2>
          <p>Use their company e-mail. Setting an existing e-mail again resets that person’s password.</p>
        </div>
        <form action={addTeamUser} className="sys-upload-row">
          <input type="email" name="email" placeholder="name@rvl13.com" required style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem", minWidth: 240 }} />
          <input type="text" name="password" placeholder="Password (min 6 chars)" required style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 13px", background: "var(--bg)", fontSize: ".92rem", minWidth: 200 }} />
          <button type="submit" className="button button-red button-small">Save member</button>
        </form>
        <p className="sys-note">Passwords are stored one-way (hashed) and can’t be read back — reset by saving a new one. Use a password unique to this tool.</p>
      </section>

      <section className="sys-card">
        <div className="sys-card-head"><h2>{users.length} member(s)</h2></div>
        {users.length === 0 ? <p className="sys-note">No team members yet — everyone sees the configurator without prices.</p> : (
          <div style={{ display: "grid", gap: 8 }}>
            {users.map((u) => (
              <div className="cat-doc-row" key={u.email}>
                <span>{u.email}<small style={{ color: "var(--muted)", marginLeft: 10 }}>added {new Date(u.createdAt).toLocaleDateString("en-GB")}</small></span>
                <form action={deleteTeamUser}>
                  <input type="hidden" name="email" value={u.email} />
                  <button type="submit">Remove</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
