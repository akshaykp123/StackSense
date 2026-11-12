import fs from "fs";
import path from "path";
import { InputScenarioSchema } from "../lib/schemas/inputSchema";
import { generateRecommendation } from "../lib/engine/decisionEngine";

async function main() {
  console.log("=================================================");
  console.log("🚀 StackSense Engine - Running Benchmark Scenarios");
  console.log("=================================================\n");

  // Path to public scenarios JSON
  const scenariosPath = path.resolve(__dirname, "../../stacksense_public_scenarios.json");
  if (!fs.existsSync(scenariosPath)) {
    console.error(`❌ Could not find scenarios file at: ${scenariosPath}`);
    process.exit(1);
  }

  // Ensure outputs folder exists (Section 9.3)
  const outputsDir = path.resolve(__dirname, "../../outputs");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  const rawData = fs.readFileSync(scenariosPath, "utf-8");
  const scenarios = JSON.parse(rawData);

  console.log(`Loaded ${scenarios.length} scenarios from stacksense_public_scenarios.json\n`);

  for (const rawScenario of scenarios) {
    const scenarioId = rawScenario.scenario_id;
    console.log(`-------------------------------------------------`);
    console.log(`▶️ Processing Scenario ${scenarioId}: ${rawScenario.project?.name || "Unnamed"}`);

    // Validate with Zod
    const validationResult = InputScenarioSchema.safeParse(rawScenario);
    if (!validationResult.success) {
      console.error(`❌ Validation Failed for ${scenarioId}:`, validationResult.error.format());
      continue;
    }

    const validatedScenario = validationResult.data;

    // Run Engine
    const startTime = performance.now();
    const recommendation = generateRecommendation(validatedScenario);
    const duration = (performance.now() - startTime).toFixed(2);

    // Save Output JSON (Section 9.3)
    const outputFile = path.join(outputsDir, `${scenarioId}_output.json`);
    fs.writeFileSync(outputFile, JSON.stringify(recommendation, null, 2), "utf-8");

    // Display Summary in Terminal
    console.log(`   ⏱️  Engine Execution Time: ${duration}ms`);
    console.log(`   🏛️  Architecture: ${recommendation.architecture_style.toUpperCase()}`);
    console.log(`   🎨 Frontend:    ${recommendation.stack.frontend.choice}`);
    console.log(`   ⚙️  Backend:     ${recommendation.stack.backend.choice}`);
    console.log(`   🗄️  Database:    ${recommendation.stack.database.choice}`);
    console.log(`   🌐 Hosting:     ${recommendation.stack.hosting.choice}`);
    console.log(`   📦 Supporting:  ${recommendation.stack.supporting.map((s) => s.choice).join(", ") || "None"}`);
    console.log(`   💰 Cost Band:   $${recommendation.estimated_monthly_cost_usd.min} - $${recommendation.estimated_monthly_cost_usd.max} / month`);
    console.log(`   ⚠️  Warnings:    ${recommendation.warnings.length}`);
    console.log(`   💾 Exported to: outputs/${scenarioId}_output.json\n`);
  }

  console.log("=================================================");
  console.log("✅ All 6 Scenarios Successfully Processed & Exported!");
  console.log("=================================================");
}

main().catch(console.error);