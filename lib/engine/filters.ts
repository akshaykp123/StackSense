import { InputScenario } from "../schemas/inputSchema";
import { TECH_CATALOG, CatalogItem } from "../catalog";

// Prunes unfeasible candidates before scoring
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

  // Drop static fallbacks for dynamic projects
  if (layer === "backend" && isDynamicApp) {
    candidates = candidates.filter((item) => item.id !== "backend_none");
  }

  if (layer === "database" && isDynamicApp) {
    candidates = candidates.filter((item) => item.id !== "database_none");
  }

  // SQLite is for local/offline mobile, not multi-user server databases
  if (
    layer === "database" &&
    !scenario.requirements.offline_support &&
    scenario.scale.users_12_months > 100
  ) {
    candidates = candidates.filter((item) => item.id !== "sqlite_embedded");
  }

  // Astro is reserved for content sites
  if (layer === "frontend" && scenario.project.type !== "content_site") {
    candidates = candidates.filter((item) => item.id !== "astro");
  }

  // Match requested target platforms
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

  // Offline support requirement
  if (scenario.requirements.offline_support) {
    if (layer === "frontend" || layer === "database") {
      const offlineCapable = candidates.filter((item) => item.supports_offline);
      if (offlineCapable.length > 0) {
        candidates = offlineCapable;
      }
    }
  }

  // Air-gapped / on-premise requirement
  if (
    scenario.infrastructure.deployment_model === "on_premise" ||
    scenario.infrastructure.deployment_model === "air_gapped"
  ) {
    candidates = candidates.filter((item) =>
      item.deployment_models.includes(scenario.infrastructure.deployment_model)
    );
  }

  // Data residency constraints
  if (scenario.infrastructure.data_residency !== "none") {
    candidates = candidates.filter(
      (item) =>
        item.data_residency_regions.includes("none") ||
        item.data_residency_regions.includes(scenario.infrastructure.data_residency)
    );
  }

  // Strict ACID needed for fintech, multi-tenant or regulated apps
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

  // SPA without SSR is poor for SEO-critical sites
  if (layer === "frontend" && scenario.requirements.seo_critical) {
    candidates = candidates.filter((item) => item.id !== "react_spa");
  }

  // Fargate for high-budget localized workloads
  if (layer === "hosting") {
    if (scenario.compliance.includes("rbi_localisation") && scenario.budget.monthly_infra_usd > 1000) {
      const enterpriseHosts = candidates.filter((item) => item.id === "aws_ecs_fargate");
      if (enterpriseHosts.length > 0) return enterpriseHosts;
    }
  }

  // Free tier only on zero budget
  if (scenario.budget.monthly_infra_usd === 0) {
    const freeTierItems = candidates.filter((item) => item.min_monthly_cost_usd === 0);
    if (freeTierItems.length > 0) {
      candidates = freeTierItems;
    }
  }

  // Fallback so we never return an empty list
  return candidates.length > 0
    ? candidates
    : TECH_CATALOG.filter((item) => item.layer === layer);
}
