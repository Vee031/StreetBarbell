// One-off / re-runnable maintenance script: recompresses product photos
// already sitting in Blob storage (uploaded before uploads were resized
// automatically) and repoints product-meta.json / custom-products.json at
// the smaller versions. Old blobs are left in place (not deleted) so this
// is safe to re-run and easy to undo. Run with:
//   node --env-file=.env.local scripts/optimize-existing-media.mjs [--apply]
// Without --apply it only reports potential savings (dry run).

import { list, put } from "@vercel/blob";
import sharp from "sharp";

const APPLY = process.argv.includes("--apply");
const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 82;
const MIN_SAVINGS_RATIO = 0.85; // only replace if the new file is meaningfully smaller

async function fetchJson(url) {
  const res = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function main() {
  const { blobs } = await list({ prefix: "products-media/", limit: 1000 });
  const images = blobs.filter((b) => /\/gallery\/.+\.(jpe?g|png|webp)$/i.test(b.pathname));

  const contentBlobs = await list({ prefix: "content/", limit: 100 });
  const metaEntry = contentBlobs.blobs.find((b) => b.pathname === "content/product-meta.json");
  const customEntry = contentBlobs.blobs.find((b) => b.pathname === "content/custom-products.json");
  const meta = metaEntry ? await fetchJson(metaEntry.url) : {};
  const custom = customEntry ? await fetchJson(customEntry.url) : {};

  const urlMap = new Map();
  let totalBefore = 0;
  let totalAfter = 0;
  let changed = 0;

  for (const blob of images) {
    const res = await fetch(blob.url);
    const input = Buffer.from(await res.arrayBuffer());
    let output;
    try {
      output = await sharp(input)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
    } catch (err) {
      console.log(`SKIP (decode failed): ${blob.pathname} — ${err.message}`);
      continue;
    }
    totalBefore += input.length;
    if (output.length >= input.length * MIN_SAVINGS_RATIO) {
      totalAfter += input.length;
      console.log(`KEEP  ${blob.pathname}  ${(input.length / 1024).toFixed(0)}KB (already efficient)`);
      continue;
    }
    totalAfter += output.length;
    changed++;
    const newPath = blob.pathname.replace(/\.[^.]+$/, "") + "-opt.jpg";
    console.log(`SHRINK ${blob.pathname}  ${(input.length / 1024).toFixed(0)}KB -> ${(output.length / 1024).toFixed(0)}KB`);
    if (APPLY) {
      const uploaded = await put(newPath, output, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "image/jpeg",
      });
      urlMap.set(blob.url, uploaded.url);
    }
  }

  console.log(`\nImages inspected: ${images.length}, shrunk: ${changed}`);
  console.log(`Total before: ${(totalBefore / 1024 / 1024).toFixed(2)}MB, after: ${(totalAfter / 1024 / 1024).toFixed(2)}MB`);

  if (!APPLY) {
    console.log("\nDry run only — pass --apply to upload the optimized versions and repoint the catalog.");
    return;
  }

  if (urlMap.size === 0) {
    console.log("Nothing changed — no catalog update needed.");
    return;
  }

  let metaChanges = 0;
  for (const entry of Object.values(meta)) {
    if (!Array.isArray(entry.gallery)) continue;
    entry.gallery = entry.gallery.map((u) => {
      const mapped = urlMap.get(u);
      if (mapped) metaChanges++;
      return mapped ?? u;
    });
  }
  let customChanges = 0;
  for (const entry of Object.values(custom)) {
    if (entry.image && urlMap.has(entry.image)) {
      entry.image = urlMap.get(entry.image);
      customChanges++;
    }
  }

  if (metaChanges > 0) {
    await put("content/product-meta.json", JSON.stringify(meta), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  }
  if (customChanges > 0) {
    await put("content/custom-products.json", JSON.stringify(custom), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  }

  console.log(`Updated ${metaChanges} product-meta gallery references, ${customChanges} custom-product main images.`);
  console.log("Old originals were left in Blob storage (not deleted) — safe to review/remove separately.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
