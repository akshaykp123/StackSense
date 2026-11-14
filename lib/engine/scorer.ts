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

    // Team language familiarity bonus
    let skillBonus = 0;
    if (scenario.team.languages.length > 0 && item.languages.length > 0) {
      const knowsLanguage = item.languages.some((lang) =>
        scenario.team.languages.includes(lang.toLowerCase())
      );
      if (knowsLanguage) {
        skillBonus = 35;
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

  return scored.sort((a, b) => b.score - a.score);
}
