import { del, list, put } from "@vercel/blob";

// Visitor inquiries from the contact form. Each inquiry is its OWN blob file
// (inquiries/<timestamp>-<random>.json) — no read-modify-write on a shared
// JSON, so two simultaneous submissions can never overwrite each other.
export const INQUIRIES_PREFIX = "inquiries/";

export type Inquiry = {
  at: string; // ISO timestamp
  locale: "en" | "cs";
  name: string;
  company: string;
  email: string;
  country: string;
  budget: string;
  area: string;
  message: string;
};

export type StoredInquiry = Inquiry & { url: string };

export async function saveInquiry(inquiry: Inquiry): Promise<void> {
  const stamp = inquiry.at.replace(/[:.]/g, "-");
  await put(`${INQUIRIES_PREFIX}${stamp}-${Math.random().toString(36).slice(2, 8)}.json`, JSON.stringify(inquiry), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    abortSignal: AbortSignal.timeout(10000),
  });
}

// Newest first. Blob pathnames start with the timestamp, so the listing sorts naturally.
export async function listInquiries(limit = 100): Promise<StoredInquiry[]> {
  const { blobs } = await list({ prefix: INQUIRIES_PREFIX, limit: 1000 });
  const newestFirst = [...blobs].sort((a, b) => (a.pathname < b.pathname ? 1 : -1)).slice(0, limit);
  const results = await Promise.all(
    newestFirst.map(async (blob) => {
      try {
        const response = await fetch(blob.url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (!response.ok) return null;
        return { ...(await response.json()), url: blob.url } as StoredInquiry;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((r): r is StoredInquiry => r !== null);
}

export async function countInquiries(): Promise<number> {
  const { blobs } = await list({ prefix: INQUIRIES_PREFIX, limit: 1000 });
  return blobs.length;
}

export async function deleteInquiry(url: string): Promise<void> {
  await del(url);
}
