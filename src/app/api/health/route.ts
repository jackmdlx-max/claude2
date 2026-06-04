import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight config probe for the UI. Reports *whether* the relevant keys are
 * configured (never their values), whether the app is running the scripted demo
 * engine, and the active model — so the frontend can set expectations before
 * the user starts typing.
 */
export function GET() {
  const demo = isDemoMode();
  return NextResponse.json({
    chat_ready: !demo,
    demo,
    image_ready: Boolean(process.env.OPENAI_API_KEY),
    model: demo ? "demo · scripted walkthrough" : process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8",
  });
}
