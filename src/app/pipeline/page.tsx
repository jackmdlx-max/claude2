"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { summarisePortfolio, type StoredIdea } from "@/lib/ideas";
import { formatGBP } from "@/lib/roi";
import { getOwnerId } from "@/lib/owner";

const STATUS: Record<string, { label: string; cls: string }> = {
  captured: { label: "Captured", cls: "bg-st-teal/10 text-st-teal-600 ring-st-teal/25" },
  in_review: { label: "In review", cls: "bg-st-sky/10 text-st-blue ring-st-sky/25" },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-600 ring-emerald-200" },
  parked: { label: "Parked", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d ago` : `${Math.floor(d / 30)}mo ago`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function PipelinePage() {
  const [ideas, setIdeas] = useState<StoredIdea[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [query, setQuery] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [team, setTeam] = useState("");
  const [sort, setSort] = useState<"newest" | "value">("newest");

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((d) => {
        setIdeas(Array.isArray(d.ideas) ? d.ideas : []);
        setPersistent(d.persistent !== false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const owner = typeof window !== "undefined" ? getOwnerId() : "";
  const teams = useMemo(
    () => Array.from(new Set(ideas.map((i) => (i.team || "Unassigned").trim()))).sort(),
    [ideas],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ideas.filter((i) => {
      if (mineOnly && i.ownerId !== owner) return false;
      if (team && (i.team || "Unassigned").trim() !== team) return false;
      if (q) {
        const hay = [i.title, i.submitterName, i.team, i.draft?.bottleneck]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return list.sort((a, b) =>
      sort === "value" ? b.roi.yearlyCostGBP - a.roi.yearlyCostGBP : b.updatedAt - a.updatedAt,
    );
  }, [ideas, query, mineOnly, team, sort, owner]);

  const summary = useMemo(() => summarisePortfolio(filtered), [filtered]);

  const inputCls = "st-focus rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white";

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-3 sm:p-5">
      <header className="overflow-hidden rounded-2xl bg-st-hero shadow-card-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10 shrink-0" />
            <div>
              <h1 className="st-wordmark font-display text-lg font-semibold leading-tight sm:text-xl">
                Idea Pipeline
              </h1>
              <p className="text-xs text-white/55">
                What the capital business is putting forward to automate
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="st-focus rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
          >
            + Submit an idea
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ideas, people, teams…"
            className={`${inputCls} min-w-[160px] flex-1 placeholder:text-white/40`}
          />
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={inputCls}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t} value={t} className="text-st-navy">
                {t}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "value")}
            className={inputCls}
          >
            <option value="newest" className="text-st-navy">
              Newest
            </option>
            <option value="value" className="text-st-navy">
              Top value
            </option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-white/80">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="accent-st-teal"
            />
            Mine
          </label>
        </div>
      </header>

      {!persistent && (
        <div className="rounded-xl border border-st-gold/40 bg-st-gold/10 px-4 py-2.5 text-xs text-[#9a6c0a]">
          <strong>Demo storage.</strong> Ideas aren&apos;t durably shared yet — connect a database
          to persist the pipeline across everyone.
        </div>
      )}

      {/* Glance stats */}
      {!loading && !failed && ideas.length > 0 && (
        <section className="grid grid-cols-3 gap-3">
          <Stat label="Ideas in view" value={String(summary.count)} />
          <Stat label="Hours / year" value={summary.totalYearlyHours.toLocaleString()} />
          <Stat label="Annual saving" value={formatGBP(summary.totalYearlyCostGBP)} accent />
        </section>
      )}

      {loading ? (
        <div className="st-card p-8 text-center text-sm text-slate-400">Loading the pipeline…</div>
      ) : failed ? (
        <div className="st-card p-8 text-center text-sm text-red-500">Couldn&apos;t load the pipeline.</div>
      ) : filtered.length === 0 ? (
        <div className="st-card p-8 text-center text-sm text-slate-500">
          {ideas.length === 0 ? (
            <>
              No ideas in the pipeline yet. Be the first —{" "}
              <Link href="/" className="font-medium text-st-teal-600">
                submit one
              </Link>
              .
            </>
          ) : (
            "No ideas match your filters."
          )}
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((i) => {
            const st = STATUS[i.status] ?? STATUS.captured;
            const systems = (i.draft?.systems_involved ?? []).slice(0, 4);
            const who = i.submitterName || "Anonymous";
            return (
              <article key={i.id} className="st-card flex flex-col p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${st.cls}`}
                  >
                    {st.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{timeAgo(i.updatedAt)}</span>
                </div>

                <h2 className="font-display text-base font-semibold leading-snug text-st-navy">
                  {i.title}
                </h2>

                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-st-teal/15 text-[10px] font-semibold text-st-teal-600">
                    {initials(who)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {who}
                    {i.team ? ` · ${i.team}` : ""}
                    {i.ownerId === owner ? " · you" : ""}
                  </span>
                </div>

                {i.draft?.bottleneck && (
                  <p className="mt-2.5 line-clamp-2 text-sm text-st-slate/80">
                    {String(i.draft.bottleneck)}
                  </p>
                )}

                {systems.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {systems.map((s) => (
                      <span
                        key={String(s)}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                      >
                        {String(s)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="text-xs text-slate-400">
                    {i.roi.yearlyCostGBP > 0 ? (
                      <>
                        <span className="font-semibold text-st-teal-600">
                          {formatGBP(i.roi.yearlyCostGBP)}/yr
                        </span>{" "}
                        · {i.roi.yearlyHours.toLocaleString()} hrs
                      </>
                    ) : (
                      "Not yet quantified"
                    )}
                  </div>
                  <Link
                    href={`/?idea=${i.id}`}
                    className="text-xs font-semibold text-st-teal-600 hover:underline"
                  >
                    Open →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="st-card p-3 sm:p-4">
      <div
        className={`font-display text-xl font-semibold sm:text-2xl ${accent ? "text-st-teal-600" : "text-st-navy"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400 sm:text-[11px]">
        {label}
      </div>
    </div>
  );
}
