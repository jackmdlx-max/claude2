import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { runEngineTurn, type MessageCreateParams } from "@/lib/engine";
import type { ChatRequest } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-8";

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set. Copy .env.example to .env.local and add your key." },
      { status: 500 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
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
