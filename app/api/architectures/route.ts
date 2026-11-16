import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. POST: Save a new architecture to PostgreSQL
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, domain, architectureStyle, minCost, maxCost, scenario, recommendation } = body;

    if (!name || !scenario || !recommendation) {
      return NextResponse.json(
        { error: "Missing required architecture fields" },
        { status: 400 }
      );
    }

    const saved = await prisma.architecture.create({
      data: {
        name,
        domain: domain || "general",
        architectureStyle: architectureStyle || "monolith",
        minCost: minCost ?? 0,
        maxCost: maxCost ?? 0,
        scenario,
        recommendation,
      },
    });

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error) {
    console.error("Failed to save architecture:", error);
    return NextResponse.json(
      { error: "Failed to save architecture to database" },
      { status: 500 }
    );
  }
}

// 2. GET: Retrieve the most recent saved architectures from PostgreSQL
export async function GET() {
  try {
    const architectures = await prisma.architecture.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ success: true, data: architectures }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch architectures:", error);
    return NextResponse.json(
      { error: "Failed to fetch architectures from database" },
      { status: 500 }
    );
  }
}