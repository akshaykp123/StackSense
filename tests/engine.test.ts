import { describe, it, expect } from "vitest";
import { generateRecommendation } from "../lib/engine/decisionEngine";
import { InputScenario } from "../lib/schemas/inputSchema";
import { PUBLIC_PRESETS } from "../lib/presets";

describe("StackSense Deterministic Engine Test Suite", () => {
  // 1. DETERMINISM TEST (LLM-off Rule)
  it("MUST produce 100% identical output across 50 consecutive runs (Zero Hallucination)", () => {
    const baseScenario = PUBLIC_PRESETS[3].scenario; // P4 (QuickCredit)
    const firstRun = JSON.stringify(generateRecommendation(baseScenario));

    for (let i = 0; i < 50; i++) {
      const currentRun = JSON.stringify(generateRecommendation(baseScenario));
      expect(currentRun).toBe(firstRun);
    }
  });

  // 2. HARD CONSTRAINT: Banking / Fintech Strict ACID Compliance
  it("Fintech domain must enforce ACID compliance and eliminate non-ACID databases", () => {
    const fintechScenario: InputScenario = {
      scenario_id: "TEST_FINTECH",
      project: {
        name: "FinFlow Core",
        type: "fintech",
        description: "Banking and payment processing engine.",
        platforms: ["web", "android"],
      },
      scale: {
        traffic_pattern: "spiky",
        workload: "write_heavy",
        users_at_launch: 1000,
        users_12_months: 50000,
        peak_concurrent_users: 500,
        data_volume_gb_12_months: 20,
      },
      team: {
        has_devops: true,
        size: 5,
        experience: "senior",
        languages: ["typescript", "go"],
      },
      budget: { monthly_infra_usd: 500 },
      timeline: { mvp_weeks: 12 },
      infrastructure: {
        cloud_preference: "any",
        deployment_model: "managed_cloud",
        data_residency: "india",
        existing_systems: [],
      },
      requirements: {
        realtime: false,
        offline_support: false,
        full_text_search: false,
        file_media_storage: true,
        payments: true,
        auth: "phone_otp",
        multi_tenant: false,
        ml_features: "none",
        seo_critical: false,
        availability: "99.99",
        p95_latency_ms: 200,
      },
      compliance: [],
      priorities: {
        cost: 2,
        time_to_market: 3,
        scalability: 5,
        performance: 4,
        maintainability: 4,
        security: 5,
      },
    };

    const recommendation = generateRecommendation(fintechScenario);
    
    // Database must be strictly relational/ACID (PostgreSQL or CockroachDB)
    expect(["PostgreSQL", "CockroachDB"]).toContain(recommendation.stack.database.choice);
    expect(recommendation.stack.database.choice).not.toBe("MongoDB");
    expect(recommendation.stack.database.choice).not.toBe("None");
  });

  // 3. HARD CONSTRAINT: Air-Gapped / Isolated Deployment
  it("Air-gapped deployment must prune all cloud SaaS (Vercel/Fargate) and pick on-premise Docker", () => {
    const airGappedScenario: InputScenario = {
      scenario_id: "TEST_AIR_GAPPED",
      project: {
        name: "Defense Secure Vault",
        type: "internal_tool",
        description: "Isolated classified records repository.",
        platforms: ["web"],
      },
      scale: {
        traffic_pattern: "steady",
        workload: "read_heavy",
        users_at_launch: 100,
        users_12_months: 500,
        peak_concurrent_users: 20,
        data_volume_gb_12_months: 10,
      },
      team: {
        has_devops: true,
        size: 3,
        experience: "senior",
        languages: ["python"],
      },
      budget: { monthly_infra_usd: 300 },
      timeline: { mvp_weeks: 8 },
      infrastructure: {
        cloud_preference: "any",
        deployment_model: "air_gapped",
        data_residency: "none",
        existing_systems: [],
      },
      requirements: {
        realtime: false,
        offline_support: false,
        full_text_search: false,
        file_media_storage: false,
        payments: false,
        auth: "enterprise_sso",
        multi_tenant: false,
        ml_features: "none",
        seo_critical: false,
        availability: "99.9",
        p95_latency_ms: null,
      },
      compliance: [],
      priorities: {
        cost: 3,
        time_to_market: 3,
        scalability: 3,
        performance: 3,
        maintainability: 4,
        security: 5,
      },
    };

    const recommendation = generateRecommendation(airGappedScenario);
    
    // Hosting must be on-premise Docker, rejecting cloud PaaS
    expect(recommendation.stack.hosting.choice).toBe("Docker on Linux VM (Self-Hosted / On-Premise)");
    expect(recommendation.stack.hosting.choice).not.toBe("Vercel");
    expect(recommendation.stack.hosting.choice).not.toBe("AWS ECS Fargate");
  });

  // 4. CONFLICT DETECTION: $0 Budget vs High Scale
  it("High-scale workload with $0 budget must trigger an architectural conflict warning", () => {
    const impossibleScenario: InputScenario = {
      ...PUBLIC_PRESETS[0].scenario, // Starts from DevFolio ($0 budget)
      scale: {
        ...PUBLIC_PRESETS[0].scenario.scale,
        users_12_months: 300000, // 300k users on $0 budget
        workload: "write_heavy",
      },
    };

    const recommendation = generateRecommendation(impossibleScenario);
    
    // Status must flag a warning or conflict
    const hasBudgetWarning = recommendation.warnings.some(
      (w) => w.code === "BUDGET_SCALE_MISMATCH" || w.code === "BUDGET_OVERRUN_RISK"
    );
    expect(hasBudgetWarning).toBe(true);
  });

  // 5. SOLO DEVELOPER CONSTRAINT: Low DevOps overhead
  it("Solo beginner developer must not be assigned distributed Kubernetes or complex Fargate", () => {
    const soloScenario: InputScenario = {
      ...PUBLIC_PRESETS[0].scenario,
      team: {
        has_devops: false,
        size: 1,
        experience: "beginner",
        languages: ["javascript"],
      },
      budget: { monthly_infra_usd: 50 },
    };

    const recommendation = generateRecommendation(soloScenario);
    
    // Should choose managed PaaS, rejecting complex microservices infrastructure
    expect(recommendation.stack.hosting.choice).not.toBe("AWS ECS Fargate");
    expect(recommendation.architecture_style).not.toBe("microservices");
  });

  // 6. BENCHMARK SCENARIO VERIFICATION: P1 to P6
  it("All 6 benchmark scenarios execute successfully with valid schema outputs", () => {
    PUBLIC_PRESETS.forEach((preset) => {
      const rec = generateRecommendation(preset.scenario);
      
      expect(rec.scenario_id).toBe(preset.id);
      expect(["ok", "warning"]).toContain(rec.status);
      expect(rec.stack.frontend.choice).toBeTruthy();
      expect(rec.stack.backend.choice).toBeTruthy();
      expect(rec.stack.database.choice).toBeTruthy();
      expect(rec.stack.hosting.choice).toBeTruthy();
      expect(rec.mermaid_diagram).toMatch(/flowchart (TD|LR)/);
      expect(rec.estimated_monthly_cost_usd.min).toBeLessThanOrEqual(rec.estimated_monthly_cost_usd.max);
    });
  });
});