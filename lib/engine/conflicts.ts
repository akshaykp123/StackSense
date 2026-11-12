import { InputScenario } from "../schemas/inputSchema";
import { Warning } from "../schemas/outputSchema";

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
