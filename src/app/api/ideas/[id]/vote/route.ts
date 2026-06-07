import { NextResponse } from "next/server";
import { getIdea, upsertIdea } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ownerFrom(req: Request): string {
  return req.headers.get("x-owner-id")?.slice(0, 64) || "anonymous";
}

/** Toggle the caller's upvote on an idea. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const idea = await getIdea(params.id);
    if (!idea) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const owner = ownerFrom(req);
    const votes = Array.isArray(idea.votes) ? idea.votes : [];
    const next = votes.includes(owner)
      ? votes.filter((v) => v !== owner)
      : [...votes, owner];

    idea.votes = next;
    await upsertIdea(idea); // updatedAt preserved — voting doesn't re-sort the feed
    return NextResponse.json({ votes: next.length, voted: next.includes(owner) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to vote.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
