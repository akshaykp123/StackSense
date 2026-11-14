import { InputScenario } from "../schemas/inputSchema";
import {
  OutputRecommendation,
  Component,
  SupportingComponent,
} from "../schemas/outputSchema";
import { CatalogItem } from "../catalog";
import { detectConflicts } from "./conflicts";
import { filterCandidates } from "./filters";
import { scoreCandidates } from "./scorer";
import { selectSupportingServices } from "./supporting";
import { generateMermaidDiagram } from "./diagram";

// Re-export modular functions for tests and external consumers
export * from "./conflicts";
export * from "./filters";
export * from "./scorer";
export * from "./supporting";
export * from "./diagram";

function determineArchitectureStyle(
  scenario: InputScenario,
  backendId: string,
  hostingId: string
): "static" | "monolith" | "modular_monolith" | "serverless" | "microservices" | "hybrid" {
  if (backendId === "backend_none") return "static";
  if (hostingId === "vercel" || hostingId === "supabase_platform") return "serverless";
  if (scenario.scale.users_12_months >= 200000 && scenario.team.size >= 6) return "microservices";
  if (backendId === "nodejs_nestjs") return "modular_monolith";
  return "monolith";
}

function calculateCostBand(
  scenario: InputScenario,
  chosenItems: CatalogItem[]
): { min: number; max: number; assumptions: string[] } {
  if (scenario.budget.monthly_infra_usd === 0) {
    return {
      min: 0,
      max: 5,
      assumptions: [
        "100% covered under free tiers (Vercel hobby plan, Supabase free tier, Upstash Redis free tier)",
        "Zero custom domain or enterprise bandwidth overages",
      ],
    };
  }

  const baseCost = chosenItems.reduce((sum, item) => sum + item.min_monthly_cost_usd, 0);
  const minCost = Math.max(5, Math.round(baseCost * 0.9));
  const maxCost = Math.min(
    scenario.budget.monthly_infra_usd,
    Math.round(baseCost * 1.5 + (scenario.scale.users_12_months / 1000) * 0.8)
  );

  return {
    min: minCost,
    max: Math.max(minCost + 10, maxCost),
    assumptions: [
      `Estimated for ${scenario.scale.users_12_months.toLocaleString()} active users after 12 months`,
      "Includes compute, managed database storage, and supporting network egress",
    ],
  };
}

export function generateRecommendation(scenario: InputScenario): OutputRecommendation {
  const warnings = detectConflicts(scenario);

  const feScored = scoreCandidates(filterCandidates("frontend", scenario), scenario);
  const beScored = scoreCandidates(filterCandidates("backend", scenario), scenario);
  const dbScored = scoreCandidates(filterCandidates("database", scenario), scenario);
  const hostScored = scoreCandidates(filterCandidates("hosting", scenario), scenario);

  const feWinner = feScored[0].item;
  const feRunnerUp = feScored[1]?.item;

  const beWinner = beScored[0].item;
  const beRunnerUp = beScored[1]?.item;

  const dbWinner = dbScored[0].item;
  const dbRunnerUp = dbScored[1]?.item;

  const hostWinner = hostScored[0].item;
  const hostRunnerUp = hostScored[1]?.item;

  const frontend: Component = {
    choice: feWinner.name,
    justification: `${feWinner.name} provides the strongest balance of productivity and platform support for ${scenario.project.platforms.join("/")} with ${scenario.team.experience} developers.`,
    driven_by: [
      "project.platforms",
      "team.languages",
      ...(scenario.requirements.seo_critical ? ["requirements.seo_critical"] : []),
    ],
        alternatives: feRunnerUp && feRunnerUp.id !== feWinner.id
      ? [{
          choice: feRunnerUp.name,
          why_not: `Lower composite score based on team skill affinity and platform constraints for this scenario.`,
        }]
      : [],
    tradeoffs: feWinner.tradeoffs,
  };

  const backend: Component = {
    choice: beWinner.name,
    justification: beWinner.id === "backend_none"
      ? "Content site with read-heavy traffic does not require a dynamic backend server; pre-rendered static assets optimize cost and availability."
      : `${beWinner.name} aligns with the team's language background and meets the projected scale (${scenario.scale.users_12_months.toLocaleString()} users).`,
    driven_by: [
      "scale.workload",
      "team.languages",
      "scale.users_12_months",
      ...(scenario.requirements.realtime ? ["requirements.realtime"] : []),
    ],
        alternatives: beRunnerUp && beRunnerUp.id !== beWinner.id
      ? [{
          choice: beRunnerUp.name,
          why_not: beRunnerUp.requires_devops && !scenario.team.has_devops
            ? "Requires higher operational and DevOps maturity than available."
            : "Lower team familiarity and higher setup overhead.",
        }]
      : [],
    tradeoffs: beWinner.tradeoffs,
  };

  const database: Component = {
    choice: dbWinner.name,
    justification: dbWinner.id === "database_none"
      ? "Static markdown-driven content eliminates database maintenance and runtime hosting costs."
      : `${dbWinner.name} satisfies storage requirements (${scenario.scale.data_volume_gb_12_months || 1} GB) and guarantees compliance with transactional consistency rules.`,
    driven_by: [
      "scale.workload",
      ...(scenario.compliance.length > 0 ? ["compliance"] : []),
      ...(scenario.requirements.offline_support ? ["requirements.offline_support"] : []),
    ],
        alternatives: dbRunnerUp && dbRunnerUp.id !== dbWinner.id
      ? [{
          choice: dbRunnerUp.name,
          why_not: "Less optimal fit for the project's ACID requirements, cost constraints, or offline sync needs.",
        }]
      : [],
    tradeoffs: dbWinner.tradeoffs,
  };

  const hosting: Component = {
    choice: hostWinner.name,
    justification: `${hostWinner.name} matches the ${scenario.infrastructure.deployment_model} deployment model within the $${scenario.budget.monthly_infra_usd}/month budget.`,
    driven_by: [
      "infrastructure.deployment_model",
      "budget.monthly_infra_usd",
      "infrastructure.cloud_preference",
      ...(scenario.infrastructure.data_residency !== "none" ? ["infrastructure.data_residency"] : []),
    ],
        alternatives: hostRunnerUp && hostRunnerUp.id !== hostWinner.id
      ? [{
          choice: hostRunnerUp.name,
          why_not: hostRunnerUp.min_monthly_cost_usd > scenario.budget.monthly_infra_usd
            ? "Exceeds designated monthly infrastructure budget."
            : "Higher maintenance overhead for the current team size.",
        }]
      : [],
    tradeoffs: hostWinner.tradeoffs,
  };

  const supporting = selectSupportingServices(scenario);
  const architectureStyle = determineArchitectureStyle(scenario, beWinner.id, hostWinner.id);
  const costBand = calculateCostBand(scenario, [feWinner, beWinner, dbWinner, hostWinner]);

  const summary = `${architectureStyle.replace("_", " ").toUpperCase()} architecture optimized for ${scenario.scale.users_12_months.toLocaleString()} users, prioritizing ${scenario.priorities.cost >= 4 ? "cost efficiency" : "scalability"} and rapid time-to-market.`;

  const mermaidDiagram = generateMermaidDiagram(
    feWinner.name,
    beWinner.name,
    dbWinner.name,
    hostWinner.name,
    supporting
  );

  const hasCritical = warnings.some((w) => w.severity === "critical");
  const status = hasCritical ? "ok_with_warnings" : "ok";

  return {
    scenario_id: scenario.scenario_id || "CUSTOM",
    engine_version: "1.0.0",
    status,
    summary,
    architecture_style: architectureStyle,
    stack: {
      frontend,
      backend,
      database,
      hosting,
      supporting,
    },
    estimated_monthly_cost_usd: costBand,
    warnings,
    assumptions: [
      `Assumed steady state usage of ${scenario.scale.users_12_months.toLocaleString()} active users.`,
      `Deployment managed under ${scenario.infrastructure.deployment_model} environment.`,
    ],
    validation_errors: [],
    mermaid_diagram: mermaidDiagram,
  };
}
