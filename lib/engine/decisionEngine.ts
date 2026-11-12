import { InputScenario } from "../schemas/inputSchema";
import {
  OutputRecommendation,
  Warning,
  Component,
  SupportingComponent,
} from "../schemas/outputSchema";
import { TECH_CATALOG, CatalogItem } from "../catalog/tech_catalog";

/**
 * Stage 1: Detects contradictory or high-risk constraints (Section 6 Edge Cases)
 */
export function detectConflicts(scenario: InputScenario): Warning[] {
  const warnings: Warning[] = [];

  // 1. Contradiction: Zero Budget with High Scale
  if (scenario.budget.monthly_infra_usd === 0 && scenario.scale.users_12_months > 10000) {
    warnings.push({
      code: "BUDGET_SCALE_MISMATCH",
      severity: "critical",
      message: `Projected scale (${scenario.scale.users_12_months.toLocaleString()} users) with $0 budget risks free-tier bandwidth and connection exhaustion.`,
      fields: ["budget.monthly_infra_usd", "scale.users_12_months"],
    });
  }

  // 2. Risk: Solo or Beginner Developer targeting Enterprise Availability (99.99%)
  if (
    (scenario.team.size === 1 || scenario.team.experience === "beginner") &&
    (scenario.requirements.availability === "99.95" || scenario.requirements.availability === "99.99")
  ) {
    warnings.push({
      code: "SOLO_DEV_HIGH_AVAILABILITY",
      severity: "warning",
      message: "Targeting 99.95%+ availability with a solo or beginner team requires managed multi-region failover to avoid on-call burnout.",
      fields: ["team.size", "team.experience", "requirements.availability"],
    });
  }

  // 3. Risk: Ultra-aggressive timeline with multiple cross-platform targets
  if (scenario.timeline.mvp_weeks <= 3 && scenario.project.platforms.length >= 3) {
    warnings.push({
      code: "TIMELINE_PLATFORM_OVERLOAD",
      severity: "warning",
      message: `Delivering across ${scenario.project.platforms.join(", ")} within ${scenario.timeline.mvp_weeks} weeks requires a cross-platform framework (e.g. Flutter/Expo) rather than separate native codebases.`,
      fields: ["timeline.mvp_weeks", "project.platforms"],
    });
  }

  // 4. Compliance: RBI / India Localization without India region
  if (
    scenario.compliance.includes("rbi_localisation") &&
    scenario.infrastructure.data_residency !== "india"
  ) {
    warnings.push({
      code: "REGULATORY_RESIDENCY_MISMATCH",
      severity: "critical",
      message: "RBI financial regulations mandate that all transaction and customer data must be stored exclusively in Indian data centers.",
      fields: ["compliance", "infrastructure.data_residency"],
    });
  }

  // 5. DevOps deficit warning
  if (!scenario.team.has_devops && scenario.infrastructure.deployment_model === "on_premise") {
    warnings.push({
      code: "ON_PREMISE_NO_DEVOPS",
      severity: "warning",
      message: "On-premise deployment selected without dedicated DevOps personnel; self-managed OS patching and hardware failures will impact timeline.",
      fields: ["team.has_devops", "infrastructure.deployment_model"],
    });
  }

  return warnings;
}



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

  // 3. Frontend Rule: Eliminate static-only Astro for dynamic SaaS, Realtime, Marketplaces, or Internal tools
  if (
    layer === "frontend" &&
    (scenario.project.type === "realtime_collab" ||
      scenario.project.type === "saas_b2b" ||
      scenario.project.type === "internal_tool" ||
      scenario.project.type === "marketplace" ||
      scenario.project.type === "fintech")
  ) {
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
    // If enterprise banking with large budget, eliminate entry-level Vercel for backend
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



export interface ScoredCandidate {
  item: CatalogItem;
  score: number;
  scoreBreakdown: {
    priorityScore: number;
    skillBonus: number;
    devopsPenalty: number;
    scaleBonus: number;
    budgetPenalty: number;
  };
}

/**
 * Stage 3: Multi-Factor Utility Scoring (Section 5.1 & 8)
 * Ranks candidates mathematically using weights, team skills, and scale.
 */
export function scoreCandidates(
  candidates: CatalogItem[],
  scenario: InputScenario
): ScoredCandidate[] {
  const scored = candidates.map((item) => {
    // 1. Priority-Weighted Utility Score
    const costScore = item.cost_rating * scenario.priorities.cost * 3;
    const scaleScore = item.scalability_rating * scenario.priorities.scalability * 3;
    const ttmScore = item.time_to_market_rating * scenario.priorities.time_to_market * 3;
    const simplicityScore = (11 - item.complexity_rating) * scenario.priorities.maintainability * 2;
    const priorityScore = costScore + scaleScore + ttmScore + simplicityScore;

    // 2. Team Skill Match Bonus (+35 points)
    let skillBonus = 0;
    if (scenario.team.languages.length > 0 && item.languages.length > 0) {
      const knowsLanguage = item.languages.some((lang) =>
        scenario.team.languages.includes(lang.toLowerCase())
      );
      if (knowsLanguage) {
        skillBonus = 35;
      }
    }

    // 3. DevOps Penalty (-40 points if team lacks DevOps but tool requires it)
    let devopsPenalty = 0;
    if (!scenario.team.has_devops && item.requires_devops) {
      devopsPenalty = -40;
    }

    // 4. Scale Affinity & Anti-Overengineering Rule
    let scaleBonus = 0;
    if (scenario.scale.users_12_months >= 100000 && item.scalability_rating >= 9) {
      scaleBonus += 25; // High-scale reward
    }
    if (scenario.scale.users_12_months <= 5000 && item.complexity_rating >= 7) {
      scaleBonus -= 20; // Penalize over-engineering for tiny projects
    }

    // 5. Budget Penalty (-50 points if base cost exceeds monthly budget)
    let budgetPenalty = 0;
    if (item.min_monthly_cost_usd > scenario.budget.monthly_infra_usd) {
      budgetPenalty = -50;
    }

    const totalScore = priorityScore + skillBonus + devopsPenalty + scaleBonus + budgetPenalty;

    return {
      item,
      score: totalScore,
      scoreBreakdown: {
        priorityScore,
        skillBonus,
        devopsPenalty,
        scaleBonus,
        budgetPenalty,
      },
    };
  });

  // Sort descending by highest score
  return scored.sort((a, b) => b.score - a.score);
}




/**
 * Stage 4: Supporting Services Selector (FR4)
 * Adds specialized services based on exact requirements.
 */
export function selectSupportingServices(scenario: InputScenario): SupportingComponent[] {
  const supporting: SupportingComponent[] = [];

  // 1. File & Media Storage
  if (scenario.requirements.file_media_storage) {
    const s3 = TECH_CATALOG.find((t) => t.id === "aws_s3_storage");
    if (s3) {
      supporting.push({
        layer: "storage",
        choice: s3.name,
        justification: "Pre-signed direct S3 uploads allow clients to store media without loading the API server; 11 9s durability guarantees asset safety.",
        driven_by: ["requirements.file_media_storage"],
        alternatives: [{ choice: "Local Disk Storage", why_not: "Unscalable and lost on container restart" }],
        tradeoffs: s3.tradeoffs,
      });
    }
  }

  // 2. In-Memory Cache / Realtime PubSub
  const needsCache =
    scenario.requirements.realtime ||
    scenario.scale.traffic_pattern === "spiky" ||
    (scenario.scale.peak_concurrent_users && scenario.scale.peak_concurrent_users > 300) ||
    scenario.scale.workload === "read_heavy";

  if (needsCache && scenario.project.type !== "content_site") {
    const redis = TECH_CATALOG.find((t) => t.id === "redis");
    if (redis) {
      supporting.push({
        layer: "cache",
        choice: redis.name,
        justification: "In-memory caching prevents database connection pool exhaustion during spiky traffic and powers low-latency Pub/Sub.",
        driven_by: [
          ...(scenario.requirements.realtime ? ["requirements.realtime"] : []),
          ...(scenario.scale.traffic_pattern === "spiky" ? ["scale.traffic_pattern"] : []),
        ],
        alternatives: [{ choice: "In-process memory cache", why_not: "Cannot be shared across multiple horizontal server instances" }],
        tradeoffs: redis.tradeoffs,
      });
    }
  }

  // 3. Message Queue / Event Streaming
  const needsQueue =
    scenario.requirements.payments ||
    scenario.scale.users_12_months >= 100000 ||
    scenario.scale.workload === "write_heavy";

  if (needsQueue && scenario.project.type !== "content_site") {
    const kafka = TECH_CATALOG.find((t) => t.id === "apache_kafka");
    if (kafka) {
      supporting.push({
        layer: "queue",
        choice: kafka.name,
        justification: "Asynchronous event queue decouples payment webhooks and write-heavy ingestion from core API latency.",
        driven_by: [
          ...(scenario.requirements.payments ? ["requirements.payments"] : []),
          ...(scenario.scale.workload === "write_heavy" ? ["scale.workload"] : []),
        ],
        alternatives: [{ choice: "Synchronous HTTP Webhooks", why_not: "Risks dropped transactions on downstream timeouts" }],
        tradeoffs: kafka.tradeoffs,
      });
    }
  }

  // 4. Full-Text Search Engine
  if (scenario.requirements.full_text_search) {
    const search = TECH_CATALOG.find((t) => t.id === "meilisearch");
    if (search) {
      supporting.push({
        layer: "search",
        choice: search.name,
        justification: "Sub-50ms typo-tolerant search index delivers instant search-as-you-type marketplace discovery.",
        driven_by: ["requirements.full_text_search"],
        alternatives: [{ choice: "SQL LIKE queries", why_not: "Causes full table scans and poor UX on misspelled queries" }],
        tradeoffs: search.tradeoffs,
      });
    }
  }

  // 5. Authentication Service
  if (scenario.requirements.auth === "phone_otp") {
    const auth = TECH_CATALOG.find((t) => t.id === "firebase_phone_auth");
    if (auth) {
      supporting.push({
        layer: "auth",
        choice: auth.name,
        justification: "Managed phone OTP delivery and session verification compliant with mobile carrier SMS routing standards.",
        driven_by: ["requirements.auth"],
        alternatives: [{ choice: "Custom SMS Gateway + Redis", why_not: "Higher development time and manual telecom compliance" }],
        tradeoffs: auth.tradeoffs,
      });
    }
  }

  // 6. Payments Infrastructure
  if (scenario.requirements.payments) {
    const payments = TECH_CATALOG.find((t) => t.id === "razorpay_gateway");
    if (payments) {
      supporting.push({
        layer: "payments",
        choice: payments.name,
        justification: "Full-stack payment gateway providing native UPI auto-pay, instant settlements, and RBI tokenization compliance.",
        driven_by: ["requirements.payments"],
        alternatives: [{ choice: "Manual Bank Transfers", why_not: "Zero automation and unacceptable drop-off during checkout" }],
        tradeoffs: payments.tradeoffs,
      });
    }
  }

  return supporting;
}



/**
 * Determines the architectural pattern (Section 4)
 */
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

/**
 * Calculates order-of-magnitude monthly cost in USD (FR6)
 */
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

/**
 * Auto-generates clean Mermaid.js syntax for interactive architecture diagrams
 */
function generateMermaidDiagram(
  frontend: string,
  backend: string,
  database: string,
  hosting: string,
  supporting: SupportingComponent[]
): string {
  let diagram = "flowchart LR\n";
  diagram += `  Client["📱 Users / Clients"] --> FE["🎨 Frontend: ${frontend}"]\n`;

  if (backend !== "None (Static / Serverless Forms)") {
    diagram += `  FE --> BE["⚙️ Backend: ${backend}"]\n`;
    diagram += `  BE --> DB[("🗄️ Database: ${database}")]\n`;
  } else {
    diagram += `  FE -.-> StaticCDN["🌐 Global Edge CDN: ${hosting}"]\n`;
  }

  supporting.forEach((s, idx) => {
    diagram += `  BE -.-> S${idx}["📦 ${s.layer.toUpperCase()}: ${s.choice}"]\n`;
  });

  diagram += `  classDef default fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#f8fafc;`;
  return diagram;
}



/**
 * Master Recommendation Engine (Section 2, 4, 5)
 * Pure deterministic pipeline converting InputScenario -> OutputRecommendation
 */
export function generateRecommendation(scenario: InputScenario): OutputRecommendation {
  const warnings = detectConflicts(scenario);

  // 1. Solve Core Layers (Frontend, Backend, Database, Hosting)
  const feScored = scoreCandidates(filterCandidates("frontend", scenario), scenario);
  const beScored = scoreCandidates(filterCandidates("backend", scenario), scenario);
  const dbScored = scoreCandidates(filterCandidates("database", scenario), scenario);
  const hostScored = scoreCandidates(filterCandidates("hosting", scenario), scenario);

  const feWinner = feScored[0].item;
  const feRunnerUp = feScored[1]?.item || feWinner;

  const beWinner = beScored[0].item;
  const beRunnerUp = beScored[1]?.item || beWinner;

  const dbWinner = dbScored[0].item;
  const dbRunnerUp = dbScored[1]?.item || dbWinner;

  const hostWinner = hostScored[0].item;
  const hostRunnerUp = hostScored[1]?.item || hostWinner;

  // 2. Build Core Components with Justifications and Alternatives (FR5)
  const frontend: Component = {
    choice: feWinner.name,
    justification: `${feWinner.name} provides the strongest balance of productivity and platform support for ${scenario.project.platforms.join("/")} with ${scenario.team.experience} developers.`,
    driven_by: [
      "project.platforms",
      "team.languages",
      ...(scenario.requirements.seo_critical ? ["requirements.seo_critical"] : []),
    ],
    alternatives: [
      {
        choice: feRunnerUp.name,
        why_not: `Lower composite score based on team skill affinity and platform constraints for this scenario.`,
      },
    ],
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
    alternatives: [
      {
        choice: beRunnerUp.name,
        why_not: beRunnerUp.requires_devops && !scenario.team.has_devops
          ? "Requires higher operational and DevOps maturity than available."
          : "Lower team familiarity and higher setup overhead.",
      },
    ],
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
    alternatives: [
      {
        choice: dbRunnerUp.name,
        why_not: "Less optimal fit for the project's ACID requirements, cost constraints, or offline sync needs.",
      },
    ],
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
    alternatives: [
      {
        choice: hostRunnerUp.name,
        why_not: hostRunnerUp.min_monthly_cost_usd > scenario.budget.monthly_infra_usd
          ? "Exceeds designated monthly infrastructure budget."
          : "Higher maintenance overhead for the current team size.",
      },
    ],
    tradeoffs: hostWinner.tradeoffs,
  };

  // 3. Select Supporting Services (FR4)
  const supporting = selectSupportingServices(scenario);

  // 4. Determine Architecture Style & Costs
  const architectureStyle = determineArchitectureStyle(scenario, beWinner.id, hostWinner.id);
  const costBand = calculateCostBand(scenario, [feWinner, beWinner, dbWinner, hostWinner]);

  // 5. Build Summary
  const summary = `${architectureStyle.replace("_", " ").toUpperCase()} architecture optimized for ${scenario.scale.users_12_months.toLocaleString()} users, prioritizing ${scenario.priorities.cost >= 4 ? "cost efficiency" : "scalability"} and rapid time-to-market.`;

  // 6. Generate Mermaid Flowchart Syntax
  const mermaidDiagram = generateMermaidDiagram(
    feWinner.name,
    beWinner.name,
    dbWinner.name,
    hostWinner.name,
    supporting
  );

  // 7. Status Resolution
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