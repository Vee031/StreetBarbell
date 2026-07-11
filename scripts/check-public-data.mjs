import { readFileSync } from "node:fs";

const products = JSON.parse(readFileSync(new URL("../data/products.json", import.meta.url), "utf8"));
const leaked = products.filter((product) => Object.values(product.prices ?? {}).some((value) => value !== null));

if (leaked.length) {
  console.error(`Public product data contains prices for ${leaked.length} product(s):`);
  console.error(leaked.slice(0, 10).map((product) => product.code).join(", "));
  process.exit(1);
}

const gitignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
if (!gitignore.split(/\r?\n/).includes(".env.local")) {
  console.error(".env.local is not explicitly ignored.");
  process.exit(1);
}

console.log(`Security check passed: ${products.length} public products contain no commercial prices.`);
