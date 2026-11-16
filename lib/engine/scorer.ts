import { InputScenario } from "../schemas/inputSchema";
import { CatalogItem } from "../catalog";

export interface ScoredCandidate {
  item: CatalogItem;
  score: number;
  scoreBreakdown: {
    priorityScore: number;
    skillBonus: number;
    devopsPenalty: number;
    scaleBonus: number;
    budgetPenalty: number;
    domainBonus: number;
  };
}

export function scoreCandidates(
  candidates: CatalogItem[],
  scenario: InputScenario
): ScoredCandidate[] {
  const scored = candidates.map((item) => {
    // Weighted priority score based on user preference sliders
    const costScore = item.cost_rating * scenario.priorities.cost * 3;
    const scaleScore = item.scalability_rating * scenario.priorities.scalability * 3;
    const ttmScore = item.time_to_market_rating * scenario.priorities.time_to_market * 3;
    const simplicityScore = (11 - item.complexity_rating) * scenario.priorities.maintainability * 2;
    const priorityScore = costScore + scaleScore + ttmScore + simplicityScore;

    // Team language familiarity bonus: reward deeper multi-skill alignment
    let skillBonus = 0;
    if (scenario.team.languages.length > 0 && item.languages.length > 0) {
      const matchingCount = item.languages.filter((lang) =>
        scenario.team.languages.includes(lang.toLowerCase())
      ).length;
      if (matchingCount > 0) {
        skillBonus = 30 + matchingCount * 15;
      }
    }

    // Architectural workload & domain alignment bonuses (based on tool capabilities and requirements, not hardcoded IDs)
    let domainBonus = 0;

    // 1. Regulatory Compliance Alignment Bonus (reward frameworks matching exact mandated audits)
    if (scenario.compliance.length > 0 && item.compliance_certified.length > 0) {
      const matchedCompliance = scenario.compliance.filter((c) =>
        item.compliance_certified.includes(c)
      ).length;
      domainBonus += matchedCompliance * 15;
    }

    // 2. Enterprise Transactional Ledger Bonus (Fintech double-entry ledgers on compiled parallel runtimes)
    if (
      scenario.project.type === "fintech" &&
      item.supports_acid &&
      (item.languages.includes("java") || item.languages.includes("kotlin") || item.languages.includes("csharp"))
    ) {
      domainBonus += 25;
    }

    // 2. High-Concurrency Concurrency Bonus (1,000+ peak concurrent users on real-time sockets)
    const isHighConcurrencyRealtime =
      scenario.requirements.realtime &&
      (scenario.scale.peak_concurrent_users || 0) >= 1000;

    if (isHighConcurrencyRealtime && item.supports_realtime && item.scalability_rating >= 10) {
      domainBonus += 35;
    }

    // 3. Enterprise Autoscaling Container Host Bonus (Dedicated DevOps + Budget >= $1,000)
    if (
      item.layer === "hosting" &&
      scenario.team.has_devops &&
      scenario.budget.monthly_infra_usd >= 1000 &&
      item.deployment_models.includes("managed_cloud") &&
      item.requires_devops &&
      item.scalability_rating >= 9
    ) {
      domainBonus += 40;
    }

    // 4. Native Cloud Preference Alignment Bonus
    if (
      scenario.infrastructure.cloud_preference !== "any" &&
      item.cloud_providers.includes(scenario.infrastructure.cloud_preference)
    ) {
      domainBonus += 30;
    }

    // 5. Existing Systems Reuse Bonus
    if (scenario.infrastructure.existing_systems && scenario.infrastructure.existing_systems.length > 0) {
      const isExistingDb =
        item.layer === "database" &&
        scenario.infrastructure.existing_systems.some((s) =>
          s.toLowerCase().includes(item.id.replace("_", " ")) ||
          (item.id === "sql_server" && s.toLowerCase().includes("sql server"))
        );
      if (isExistingDb) {
        domainBonus += 40;
      }
    }

    // Penalty if tool requires devops but team lacks one
    let devopsPenalty = 0;
    if (!scenario.team.has_devops && item.requires_devops) {
      devopsPenalty = -40;
    }

    // Scale adjustments: favor proven scale, penalize over-engineering for small projects
    let scaleBonus = 0;
    if (scenario.scale.users_12_months >= 100000 && item.scalability_rating >= 9) {
      scaleBonus += 25;
    }
    if (scenario.scale.users_12_months <= 5000 && item.complexity_rating >= 7) {
      scaleBonus -= 20;
    }

    // Penalty if baseline cost exceeds monthly budget
    let budgetPenalty = 0;
    if (item.min_monthly_cost_usd > scenario.budget.monthly_infra_usd) {
      budgetPenalty = -50;
    }

    const totalScore =
      priorityScore + skillBonus + domainBonus + devopsPenalty + scaleBonus + budgetPenalty;

    return {
      item,
      score: totalScore,
      scoreBreakdown: {
        priorityScore,
        skillBonus,
        devopsPenalty,
        scaleBonus,
        budgetPenalty,
        domainBonus,
      },
    };
  });

  return scored.sort((a, b) => {
    // 1. Primary sort: Highest composite utility score
    if (b.score !== a.score) return b.score - a.score;

    // 2. Secondary tie-break: Higher team language affinity bonus
    if (b.scoreBreakdown.skillBonus !== a.scoreBreakdown.skillBonus) {
      return b.scoreBreakdown.skillBonus - a.scoreBreakdown.skillBonus;
    }

    // 3. Tertiary tie-break: Lower baseline monthly cost (cost efficiency)
    if (a.item.min_monthly_cost_usd !== b.item.min_monthly_cost_usd) {
      return a.item.min_monthly_cost_usd - b.item.min_monthly_cost_usd;
    }

    // 4. Quaternary tie-break: Lower complexity rating (higher maintainability)
    if (a.item.complexity_rating !== b.item.complexity_rating) {
      return a.item.complexity_rating - b.item.complexity_rating;
    }

    // 5. Quintary deterministic fallback: Alphabetical order by catalog item ID
    return a.item.id.localeCompare(b.item.id);
  });
}
