import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/engine/decisionEngine";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recommendation = runEngine(body);
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