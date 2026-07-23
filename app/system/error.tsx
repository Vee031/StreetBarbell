"use client";

// Shown when an admin page cannot load its data — typically when the Vercel
// Blob store is suspended or unreachable. Editing is blocked in that state on
// purpose: saving over a failed read could overwrite good data with emptiness.
export default function SystemError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="sys-shell" style={{ paddingTop: 80 }}>
      <div className="sys-banner sys-error" style={{ display: "grid", gap: 10, padding: "22px 24px" }}>
        <strong style={{ fontSize: "1.05rem" }}>Content storage is unreachable</strong>
        <span>
          The admin cannot load the site&apos;s content data right now — most likely the Vercel Blob store
          is suspended (check vercel.com → Storage) or temporarily unreachable. Nothing is lost: the data
          stays in storage, and editing is disabled until it can be read again so no save can overwrite it.
        </span>
        <span>The public website keeps running on its built-in content in the meantime.</span>
        <div>
          <button className="button button-red button-small" onClick={() => reset()}>Try again</button>
        </div>
      </div>
    </div>
  );
}
