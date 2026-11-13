import { NextRequest, NextResponse } from "next/server";
import { InputScenarioSchema } from "@/lib/schemas/inputSchema";
import { generateRecommendation } from "@/lib/engine/decisionEngine";

/**
 * POST /api/recommend
 * Accepts an InputScenario JSON, validates it, and returns the OutputRecommendation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse the incoming JSON body
    const body = await request.json();

    // 2. Validate input against Zod schema (Section 3 of Problem Statement)
    const validationResult = InputScenarioSchema.safeParse(body);

    if (!validationResult.success) {
      // Return 400 Bad Request with field-level errors
      return NextResponse.json(
        {
          status: "invalid_input",
          summary: "Input validation failed. Please check the provided parameters.",
          validation_errors: validationResult.error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // 3. Execute the 3-Stage Decision Engine
    const validatedScenario = validationResult.data;
    const recommendation = generateRecommendation(validatedScenario);

    // 4. Return 200 OK with the Section 4 Output JSON
    return NextResponse.json(recommendation, { status: 200 });
  } catch (error) {
    console.error("API Error in /api/recommend:", error);
    return NextResponse.json(
      {
        status: "error",
        summary: "Internal server error occurred while processing recommendation.",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}