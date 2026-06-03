import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight config probe for the UI. Reports *whether* the relevant keys are
 * configured (never their values) plus the active model, so the frontend can
 * warn the user before they start typing into a misconfigured deployment.
 */
export function GET() {
  return NextResponse.json({
    chat_ready: Boolean(process.env.ANTHROPIC_API_KEY),
    image_ready: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
  });
}
