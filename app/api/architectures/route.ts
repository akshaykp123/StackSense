import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Resilient wrapper to handle Neon Serverless PostgreSQL cold-start wakeups.
 * If Neon is waking up from auto-suspend, retries with backoff instead of timing out.
 */
async function withNeonRetry<T>(operation: () => Promise<T>, retries = 2, delayMs = 1200): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const msg = String(err?.message || "");
      const isConnectionError =
        msg.includes("Can't reach database server") ||
        msg.includes("Connection refused") ||
        msg.includes("connection closed") ||
        msg.includes("ETIMEDOUT") ||
        err?.code === "P1001" ||
        err?.name === "PrismaClientInitializationError";

      if (isConnectionError && attempt < retries) {
        console.warn(`[Neon PostgreSQL] Cold start wakeup detected. Retrying query in ${delayMs}ms (attempt ${attempt + 1}/${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// 1. POST: Save a new architecture recommendation to PostgreSQL (tagged with clientId)
export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not set in environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { name, domain, architectureStyle, minCost, maxCost, scenario, recommendation, clientId } = body;

    // Validate minimum required fields
    if (!name || !scenario || !recommendation) {
      return NextResponse.json(
        { error: "Missing required architecture fields" },
        { status: 400 }
      );
    }

    const assignedClientId =
      clientId && typeof clientId === "string" && clientId.trim().length > 0
        ? clientId.trim()
        : "anonymous";

    // Save record to Neon PostgreSQL using Prisma
    const saved = await withNeonRetry(() =>
      prisma.architecture.create({
        data: {
          name,
          domain: domain || "general",
          architectureStyle: architectureStyle || "monolith",
          minCost: minCost ?? 0,
          maxCost: maxCost ?? 0,
          scenario,
          recommendation,
          clientId: assignedClientId,
        },
      })
    );

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to save architecture to PostgreSQL:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save architecture to database" },
      { status: 500 }
    );
  }
}

// 2. GET: Fetch architectures isolated by the user's clientId
export async function GET(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not set in environment variables." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId")?.trim();

    // Query Neon PostgreSQL for architectures belonging to this client session
    const architectures = await withNeonRetry(() =>
      prisma.architecture.findMany({
        where: clientId
          ? { clientId: clientId }
          : { clientId: "anonymous" },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    );

    return NextResponse.json({ success: true, data: architectures }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch architectures from PostgreSQL:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch architectures from database" },
      { status: 500 }
    );
  }
}

// 3. DELETE: Remove an architecture from PostgreSQL with client ownership verification
export async function DELETE(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL is not set in environment variables." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clientId = searchParams.get("clientId")?.trim();

    if (!id) {
      return NextResponse.json({ error: "Missing architecture id" }, { status: 400 });
    }

    // Verify record exists and caller owns it
    const existing = await withNeonRetry(() =>
      prisma.architecture.findUnique({
        where: { id },
      })
    );

    if (!existing) {
      return NextResponse.json({ error: "Architecture not found in database" }, { status: 404 });
    }

    // If record is owned by a specific client, verify ownership
    if (existing.clientId && existing.clientId !== "anonymous") {
      if (!clientId || existing.clientId !== clientId) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to delete this architecture." },
          { status: 403 }
        );
      }
    }

    // Delete record from PostgreSQL
    await withNeonRetry(() =>
      prisma.architecture.delete({
        where: { id },
      })
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to delete architecture from PostgreSQL:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete architecture from database" },
      { status: 500 }
    );
  }
}
