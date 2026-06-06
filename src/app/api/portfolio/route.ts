import { NextResponse } from "next/server";
import { listIdeas, isPersistent } from "@/lib/store";
import { summarisePortfolio } from "@/lib/ideas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ideas = await listIdeas();
    return NextResponse.json({
      summary: summarisePortfolio(ideas),
      ideas,
      persistent: isPersistent(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build portfolio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
