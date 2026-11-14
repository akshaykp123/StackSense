import { NextRequest, NextResponse } from "next/server";
import { InputScenarioSchema } from "@/lib/schemas/inputSchema";
import { generateRecommendation } from "@/lib/engine/decisionEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = InputScenarioSchema.safeParse(body);

    if (!validationResult.success) {
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

    const recommendation = generateRecommendation(validationResult.data);
    return NextResponse.json(recommendation, { status: 200 });
  } catch (error) {
    console.error("API error in /api/recommend:", error);
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