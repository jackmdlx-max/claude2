import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { runEngineTurn, type MessageCreateParams } from "@/lib/engine";
import { isDemoMode, runDemoTurn } from "@/lib/demo-engine";
import type { ChatRequest } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

export async function POST(req: Request) {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  // Demo mode: a scripted walkthrough that needs no API key and costs nothing.
  // The short pause lets the canned reply feel like the engine is "typing".
  if (isDemoMode()) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return NextResponse.json(runDemoTurn(messages));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key." },
      { status: 500 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    const envelope = await runEngineTurn(
      (params: MessageCreateParams) => client.messages.create(params),
      MODEL,
      messages,
    );
    return NextResponse.json(envelope);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error talking to the engine.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
