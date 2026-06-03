import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Optional image-generation hook for the Stage 4 UI mockup.
 *
 * ST-Streamline emits a highly descriptive `ui_mockup_prompt`. If you have an
 * image API available, wire it up here. By default we look for an OpenAI key
 * and call the Images API; if none is configured we return `unavailable` so
 * the frontend gracefully renders the prompt as a schematic spec card instead.
 */
export async function POST(req: Request) {
  let prompt = "";
  try {
    ({ prompt } = (await req.json()) as { prompt: string });
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    // No image backend configured — let the UI fall back to the spec card.
    return NextResponse.json({ unavailable: true, prompt });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ unavailable: true, prompt, detail }, { status: 200 });
    }

    const data = (await res.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };
    const first = data.data?.[0];
    const image_url = first?.url
      ? first.url
      : first?.b64_json
        ? `data:image/png;base64,${first.b64_json}`
        : null;

    if (!image_url) return NextResponse.json({ unavailable: true, prompt });
    return NextResponse.json({ image_url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "image generation failed";
    return NextResponse.json({ unavailable: true, prompt, detail });
  }
}
