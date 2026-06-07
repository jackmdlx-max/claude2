import type { Pool } from "pg";
import type { StoredIdea } from "./ideas";

/**
 * Idea storage. Durable + shared via Postgres when a connection string is
 * configured; otherwise a per-instance in-memory fallback so the app still runs
 * in demo/preview (non-durable — connect a database to persist).
 *
 * Vercel storage integrations sometimes prefix the env vars (e.g.
 * `capitalbusiness_POSTGRES_URL`), so we resolve the connection string from any
 * matching key rather than relying on the bare `POSTGRES_URL` name.
 */

function connectionString(): string | undefined {
  const env = process.env;
  if (env.POSTGRES_URL) return env.POSTGRES_URL;
  const pooled = Object.keys(env).find(
    (k) => /POSTGRES_URL$/.test(k) && !/NON_POOLING|NO_SSL/.test(k) && env[k],
  );
  if (pooled) return env[pooled];
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const db = Object.keys(env).find((k) => /DATABASE_URL$/.test(k) && !/UNPOOLED/.test(k) && env[k]);
  return db ? env[db] : undefined;
}

export function isPersistent(): boolean {
  return Boolean(connectionString());
}

// In-memory fallback (resets on cold start; not shared across instances).
const mem = new Map<string, StoredIdea>();

let pool: Pool | null = null;
async function getPool(): Promise<Pool> {
  if (!pool) {
    const { Pool } = await import("pg");
    pool = new Pool({
      connectionString: connectionString(),
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

let schemaReady = false;
async function ensureSchema(db: Pool): Promise<void> {
  if (schemaReady) return;
  await db.query(`CREATE TABLE IF NOT EXISTS ideas (
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
  )`);
  schemaReady = true;
}

export async function upsertIdea(idea: StoredIdea): Promise<void> {
  if (!isPersistent()) {
    mem.set(idea.id, idea);
    return;
  }
  const db = await getPool();
  await ensureSchema(db);
  await db.query(
    `INSERT INTO ideas
       (id, owner_id, title, team, status, data, yearly_hours, yearly_cost, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
     ON CONFLICT (id) DO UPDATE SET
       owner_id=EXCLUDED.owner_id, title=EXCLUDED.title, team=EXCLUDED.team,
       status=EXCLUDED.status, data=EXCLUDED.data, yearly_hours=EXCLUDED.yearly_hours,
       yearly_cost=EXCLUDED.yearly_cost, updated_at=EXCLUDED.updated_at`,
    [
      idea.id,
      idea.ownerId,
      idea.title,
      idea.team ?? null,
      idea.status,
      JSON.stringify(idea),
      idea.roi.yearlyHours,
      idea.roi.yearlyCostGBP,
      idea.createdAt,
      idea.updatedAt,
    ],
  );
}

export async function getIdea(id: string): Promise<StoredIdea | null> {
  if (!isPersistent()) return mem.get(id) ?? null;
  const db = await getPool();
  await ensureSchema(db);
  const { rows } = await db.query("SELECT data FROM ideas WHERE id = $1 LIMIT 1", [id]);
  return rows[0] ? (rows[0].data as StoredIdea) : null;
}

export async function listIdeas(opts: { ownerId?: string } = {}): Promise<StoredIdea[]> {
  if (!isPersistent()) {
    const all = Array.from(mem.values());
    const filtered = opts.ownerId ? all.filter((i) => i.ownerId === opts.ownerId) : all;
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  const db = await getPool();
  await ensureSchema(db);
  const { rows } = opts.ownerId
    ? await db.query("SELECT data FROM ideas WHERE owner_id = $1 ORDER BY updated_at DESC", [
        opts.ownerId,
      ])
    : await db.query("SELECT data FROM ideas ORDER BY updated_at DESC");
  return rows.map((r) => r.data as StoredIdea);
}

export async function deleteIdea(id: string, ownerId: string): Promise<void> {
  if (!isPersistent()) {
    const existing = mem.get(id);
    if (existing && existing.ownerId === ownerId) mem.delete(id);
    return;
  }
  const db = await getPool();
  await ensureSchema(db);
  await db.query("DELETE FROM ideas WHERE id = $1 AND owner_id = $2", [id, ownerId]);
}
