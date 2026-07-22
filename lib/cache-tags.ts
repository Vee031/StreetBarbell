// Shared cache-tag constants, extracted to their own module so lib/products-store
// and lib/product-groups can both import them without importing each other
// (products-store now reads the groups store to resolve group categories).
export const PRODUCTS_CACHE_TAG = "products";
