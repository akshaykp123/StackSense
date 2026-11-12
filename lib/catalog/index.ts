import { CatalogItem } from "./types";
import { FRONTEND_TECHNOLOGIES } from "./frontend";
import { BACKEND_TECHNOLOGIES } from "./backend";
import { DATABASE_TECHNOLOGIES } from "./database";
import { HOSTING_TECHNOLOGIES } from "./hosting";
import { SUPPORTING_TECHNOLOGIES } from "./supporting";

export * from "./types";
export * from "./frontend";
export * from "./backend";
export * from "./database";
export * from "./hosting";
export * from "./supporting";

/**
 * Unified catalog containing all 28 production technologies
 */
export const TECH_CATALOG: CatalogItem[] = [
  ...FRONTEND_TECHNOLOGIES,
  ...BACKEND_TECHNOLOGIES,
  ...DATABASE_TECHNOLOGIES,
  ...HOSTING_TECHNOLOGIES,
  ...SUPPORTING_TECHNOLOGIES,
];
