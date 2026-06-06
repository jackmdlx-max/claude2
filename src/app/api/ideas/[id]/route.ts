import { NextResponse } from "next/server";
import { getIdea, deleteIdea } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ownerFrom(req: Request): string {
  return req.headers.get("x-owner-id")?.slice(0, 64) || "anonymous";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const idea = await getIdea(params.id);
    if (!idea) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ idea });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load idea.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteIdea(params.id, ownerFrom(req));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete idea.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
