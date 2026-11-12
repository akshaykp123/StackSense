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
