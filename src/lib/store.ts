import type { StoredIdea } from "./ideas";

/**
 * Idea storage. Durable + shared via Vercel Postgres when `POSTGRES_URL` is
 * configured; otherwise a per-instance in-memory fallback so the app still runs
 * in demo/preview (non-durable — connect a database to persist for real).
 */

export function isPersistent(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

// In-memory fallback (resets on cold start; not shared across instances).
const mem = new Map<string, StoredIdea>();

async function getSql() {
  const { sql } = await import("@vercel/postgres");
  return sql;
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = await getSql();
  await sql`CREATE TABLE IF NOT EXISTS ideas (
    id            text PRIMARY KEY,
    owner_id      text,
    title         text,
    team          text,
    status        text,
    data          jsonb NOT NULL,
    yearly_hours  double precision DEFAULT 0,
    yearly_cost   double precision DEFAULT 0,
    created_at    bigint,
    updated_at    bigint
  )`;
  schemaReady = true;
}

export async function upsertIdea(idea: StoredIdea): Promise<void> {
  if (!isPersistent()) {
    mem.set(idea.id, idea);
    return;
  }
  await ensureSchema();
  const sql = await getSql();
  await sql`INSERT INTO ideas
      (id, owner_id, title, team, status, data, yearly_hours, yearly_cost, created_at, updated_at)
    VALUES
      (${idea.id}, ${idea.ownerId}, ${idea.title}, ${idea.team ?? null}, ${idea.status},
       ${JSON.stringify(idea)}::jsonb, ${idea.roi.yearlyHours}, ${idea.roi.yearlyCostGBP},
       ${idea.createdAt}, ${idea.updatedAt})
    ON CONFLICT (id) DO UPDATE SET
      owner_id = EXCLUDED.owner_id, title = EXCLUDED.title, team = EXCLUDED.team,
      status = EXCLUDED.status, data = EXCLUDED.data, yearly_hours = EXCLUDED.yearly_hours,
      yearly_cost = EXCLUDED.yearly_cost, updated_at = EXCLUDED.updated_at`;
}

export async function getIdea(id: string): Promise<StoredIdea | null> {
  if (!isPersistent()) return mem.get(id) ?? null;
  await ensureSchema();
  const sql = await getSql();
  const { rows } = await sql`SELECT data FROM ideas WHERE id = ${id} LIMIT 1`;
  return rows[0] ? (rows[0].data as StoredIdea) : null;
}

export async function listIdeas(opts: { ownerId?: string } = {}): Promise<StoredIdea[]> {
  if (!isPersistent()) {
    const all = Array.from(mem.values());
    const filtered = opts.ownerId ? all.filter((i) => i.ownerId === opts.ownerId) : all;
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  await ensureSchema();
  const sql = await getSql();
  const { rows } = opts.ownerId
    ? await sql`SELECT data FROM ideas WHERE owner_id = ${opts.ownerId} ORDER BY updated_at DESC`
    : await sql`SELECT data FROM ideas ORDER BY updated_at DESC`;
  return rows.map((r) => r.data as StoredIdea);
}

export async function deleteIdea(id: string, ownerId: string): Promise<void> {
  if (!isPersistent()) {
    const existing = mem.get(id);
    if (existing && existing.ownerId === ownerId) mem.delete(id);
    return;
  }
  await ensureSchema();
  const sql = await getSql();
  await sql`DELETE FROM ideas WHERE id = ${id} AND owner_id = ${ownerId}`;
}
