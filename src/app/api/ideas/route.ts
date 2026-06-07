import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { listIdeas, upsertIdea, isPersistent } from "@/lib/store";
import { roiForDraft, type IdeaStatus, type StoredIdea } from "@/lib/ideas";
import type { BusinessCaseDraft, ChatMessage, SolutionDesign } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ownerFrom(req: Request): string {
  return req.headers.get("x-owner-id")?.slice(0, 64) || "anonymous";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine") === "1";
  try {
    const ideas = await listIdeas(mine ? { ownerId: ownerFrom(req) } : {});
    return NextResponse.json({ ideas, persistent: isPersistent() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list ideas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface IdeaPayload {
  id?: string;
  title?: string;
  submitterName?: string;
  team?: string;
  status?: IdeaStatus;
  draft?: BusinessCaseDraft | null;
  solutionDesign?: SolutionDesign | null;
  mockupPrompt?: string | null;
  messages?: ChatMessage[];
  stage?: number;
}

export async function POST(req: Request) {
  let body: IdeaPayload;
  try {
    body = (await req.json()) as IdeaPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const ownerId = ownerFrom(req);
  const now = Date.now();
  const draft = body.draft ?? null;
  const title =
    (body.title && body.title.trim()) ||
    (draft?.bottleneck ? String(draft.bottleneck).slice(0, 80) : "Untitled idea");

  const idea: StoredIdea = {
    id: body.id || randomUUID(),
    ownerId,
    submitterName: body.submitterName?.trim() || null,
    title,
    team: body.team?.trim() || null,
    status: body.status ?? "captured",
    createdAt: now,
    updatedAt: now,
    draft,
    solutionDesign: body.solutionDesign ?? null,
    mockupPrompt: body.mockupPrompt ?? null,
    messages: Array.isArray(body.messages) ? body.messages : [],
    stage: typeof body.stage === "number" ? body.stage : 1,
    roi: roiForDraft(draft),
  };

  try {
    // Preserve createdAt on update by merging when the id already exists.
    if (body.id) {
      const { getIdea } = await import("@/lib/store");
      const existing = await getIdea(body.id);
      if (existing && existing.ownerId === ownerId) idea.createdAt = existing.createdAt;
    }
    await upsertIdea(idea);
    return NextResponse.json({ idea, persistent: isPersistent() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save idea.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
