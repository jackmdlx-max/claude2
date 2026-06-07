import { NextResponse } from "next/server";
import { getIdea, upsertIdea } from "@/lib/store";
import type { IdeaStatus } from "@/lib/ideas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: IdeaStatus[] = ["captured", "in_review", "approved", "parked"];

/** Move an idea along the pipeline. (No roles yet — collaborative until SSO.) */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const status = body.status as IdeaStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }
  try {
    const idea = await getIdea(params.id);
    if (!idea) return NextResponse.json({ error: "Not found." }, { status: 404 });
    idea.status = status;
    await upsertIdea(idea);
    return NextResponse.json({ status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
