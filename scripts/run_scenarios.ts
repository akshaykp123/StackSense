import fs from "fs";
import path from "path";
import { InputScenarioSchema } from "../lib/schemas/inputSchema";
import { generateRecommendation } from "../lib/engine/decisionEngine";

async function main() {
  const scenariosPath = path.resolve(__dirname, "../../stacksense_public_scenarios.json");
  if (!fs.existsSync(scenariosPath)) {
    console.error(`Could not find scenarios file: ${scenariosPath}`);
    process.exit(1);
  }

  const outputsDir = path.resolve(__dirname, "../../outputs");
  if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
  }

  const rawData = fs.readFileSync(scenariosPath, "utf-8");
  const scenarios = JSON.parse(rawData);

  console.log(`Running ${scenarios.length} benchmark scenarios...`);

  for (const rawScenario of scenarios) {
    const scenarioId = rawScenario.scenario_id;
    const name = rawScenario.project?.name || "Unnamed";

    const validationResult = InputScenarioSchema.safeParse(rawScenario);
    if (!validationResult.success) {
      console.error(`Validation failed for ${scenarioId}:`, validationResult.error.format());
      continue;
    }

    const validatedScenario = validationResult.data;

    const startTime = performance.now();
    const recommendation = generateRecommendation(validatedScenario);
    const duration = (performance.now() - startTime).toFixed(2);

    const outputFile = path.join(outputsDir, `${scenarioId}_output.json`);
    fs.writeFileSync(outputFile, JSON.stringify(recommendation, null, 2), "utf-8");

    console.log(`[${scenarioId}] ${name} -> ${recommendation.architecture_style} (${duration}ms)`);
    console.log(`  Frontend:   ${recommendation.stack.frontend.choice}`);
    console.log(`  Backend:    ${recommendation.stack.backend.choice}`);
    console.log(`  Database:   ${recommendation.stack.database.choice}`);
    console.log(`  Hosting:    ${recommendation.stack.hosting.choice}`);
    console.log(`  Cost band:  $${recommendation.estimated_monthly_cost_usd.min} - $${recommendation.estimated_monthly_cost_usd.max}/mo`);
    console.log(`  Output:     outputs/${scenarioId}_output.json`);
  }

  console.log(`Done. Saved all outputs to ${outputsDir}`);
}

main().catch(console.error);