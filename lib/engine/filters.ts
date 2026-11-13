import { InputScenario } from "../schemas/inputSchema";
import { TECH_CATALOG, CatalogItem } from "../catalog";

/**
 * Stage 2: Hard Deterministic Constraint Filter (Section 5.3)
 * Prunes unfeasible technologies before scoring begins.
 */
export function filterCandidates(
  layer: "frontend" | "backend" | "database" | "hosting",
  scenario: InputScenario
): CatalogItem[] {
  let candidates = TECH_CATALOG.filter(
    (item) => item.layer === layer && !item.is_deprecated
  );

  const isDynamicApp =
    scenario.project.type !== "content_site" ||
    scenario.requirements.auth !== "none" ||
    scenario.requirements.payments ||
    scenario.requirements.realtime;

  // 1. Backend Rule: Eliminate "None" for dynamic apps
  if (layer === "backend" && isDynamicApp) {
    candidates = candidates.filter((item) => item.id !== "backend_none");
  }

  // 2. Database Rule: Eliminate "None" for dynamic apps
  if (layer === "database" && isDynamicApp) {
    candidates = candidates.filter((item) => item.id !== "database_none");
  }

  // 2b. Centralized Multi-User Database Rule:
  // Embedded SQLite is only for offline mobile or single-user environments; eliminate for multi-user server databases
  if (
    layer === "database" &&
    !scenario.requirements.offline_support &&
    scenario.scale.users_12_months > 100
  ) {
    candidates = candidates.filter((item) => item.id !== "sqlite_embedded");
  }

  // 3. Frontend Rule: Astro is exclusively for content sites and blogs.
  // Eliminate Astro for all dynamic web applications, SaaS, and marketplaces in favor of Next.js / React
  if (layer === "frontend" && scenario.project.type !== "content_site") {
    candidates = candidates.filter((item) => item.id !== "astro");
  }

  // 4. Platform Hard Filter (Frontend Layer)
  if (layer === "frontend") {
    const requestedPlatforms = scenario.project.platforms;
    const needsMobile = requestedPlatforms.includes("android") || requestedPlatforms.includes("ios");
    const isMobileOnly = needsMobile && !requestedPlatforms.includes("web");

    if (isMobileOnly) {
      candidates = candidates.filter((item) =>
        item.platforms.includes("android") || item.platforms.includes("ios")
      );
    } else if (needsMobile) {
      candidates = candidates.filter((item) =>
        (item.platforms.includes("android") || item.platforms.includes("ios")) &&
        item.platforms.includes("web")
      );
    }
  }

  // 5. Offline Support Hard Filter (Frontend & Database)
  if (scenario.requirements.offline_support) {
    if (layer === "frontend" || layer === "database") {
      const offlineCapable = candidates.filter((item) => item.supports_offline);
      if (offlineCapable.length > 0) {
        candidates = offlineCapable;
      }
    }
  }

  // 6. Deployment Model Hard Filter (On-Premise / Air-Gapped)
  if (
    scenario.infrastructure.deployment_model === "on_premise" ||
    scenario.infrastructure.deployment_model === "air_gapped"
  ) {
    candidates = candidates.filter((item) =>
      item.deployment_models.includes(scenario.infrastructure.deployment_model)
    );
  }

  // 7. Data Residency Hard Filter (India / EU / US)
  if (scenario.infrastructure.data_residency !== "none") {
    candidates = candidates.filter(
      (item) =>
        item.data_residency_regions.includes("none") ||
        item.data_residency_regions.includes(scenario.infrastructure.data_residency)
    );
  }

  // 8. Strict ACID Filter (Database Layer)
  if (layer === "database") {
    const needsStrictAcid =
      scenario.project.type === "fintech" ||
      scenario.compliance.includes("rbi_localisation") ||
      scenario.compliance.includes("pci_dss") ||
      scenario.requirements.multi_tenant;

    if (needsStrictAcid) {
      candidates = candidates.filter((item) => item.supports_acid);
    }
  }

  // 9. SEO-Critical Filter (Frontend Layer)
  if (layer === "frontend" && scenario.requirements.seo_critical) {
    candidates = candidates.filter((item) => item.id !== "react_spa");
  }

  // 10. High-Scale Enterprise Hosting Filter
  if (layer === "hosting") {
    if (scenario.compliance.includes("rbi_localisation") && scenario.budget.monthly_infra_usd > 1000) {
      const enterpriseHosts = candidates.filter((item) => item.id === "aws_ecs_fargate");
      if (enterpriseHosts.length > 0) return enterpriseHosts;
    }
  }

  // 11. Zero-Budget Filter
  if (scenario.budget.monthly_infra_usd === 0) {
    const freeTierItems = candidates.filter((item) => item.min_monthly_cost_usd === 0);
    if (freeTierItems.length > 0) {
      candidates = freeTierItems;
    }
  }

  // Graceful fallback: never return an empty list
  return candidates.length > 0
    ? candidates
    : TECH_CATALOG.filter((item) => item.layer === layer);
}
