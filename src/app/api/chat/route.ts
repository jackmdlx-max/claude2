import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { ST_STREAMLINE_SYSTEM_PROMPT } from "@/lib/system-prompt";
import { extractEnvelope } from "@/lib/envelope";
import { prepareMessages } from "@/lib/prepare-messages";
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

  // Coerce the UI transcript into a valid Anthropic message list (non-empty,
  // starting with a user turn). See prepare-messages.ts.
  const messages = prepareMessages(Array.isArray(body.messages) ? body.messages : []);

  const client = new Anthropic({ apiKey });

  try {
    const completion = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: ST_STREAMLINE_SYSTEM_PROMPT,
      messages,
    });

    const text = completion.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    const envelope = extractEnvelope(text);
    return NextResponse.json(envelope);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error talking to the engine.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
