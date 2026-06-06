"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { summarisePortfolio, type StoredIdea } from "@/lib/ideas";
import { formatGBP } from "@/lib/roi";
import { getOwnerId } from "@/lib/owner";

const STATUS_LABEL: Record<string, string> = {
  captured: "Captured",
  in_review: "In review",
  approved: "Approved",
  parked: "Parked",
};

export default function PortfolioPage() {
  const [ideas, setIdeas] = useState<StoredIdea[]>([]);
  const [persistent, setPersistent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [mineOnly, setMineOnly] = useState(false);
  const [team, setTeam] = useState("");
  const [system, setSystem] = useState("");

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
  const systems = useMemo(
    () =>
      Array.from(
        new Set(ideas.flatMap((i) => i.draft?.systems_involved ?? []).map((s) => String(s).trim())),
      )
        .filter(Boolean)
        .sort(),
    [ideas],
  );

  const filtered = useMemo(
    () =>
      ideas.filter((i) => {
        if (mineOnly && i.ownerId !== owner) return false;
        if (team && (i.team || "Unassigned").trim() !== team) return false;
        if (system && !(i.draft?.systems_involved ?? []).map(String).includes(system)) return false;
        return true;
      }),
    [ideas, mineOnly, team, system, owner],
  );

  const summary = useMemo(() => summarisePortfolio(filtered), [filtered]);
  const maxTeamCost = Math.max(1, ...summary.byTeam.map((t) => t.yearlyCostGBP));

  const inputCls =
    "st-focus rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white";

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-3 sm:p-5">
      <header className="overflow-hidden rounded-2xl bg-st-hero shadow-card-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-10 shrink-0" />
            <div>
              <h1 className="st-wordmark font-display text-lg font-semibold leading-tight sm:text-xl">
                Idea Portfolio
              </h1>
              <p className="text-xs text-white/55">
                Automation opportunities captured across the capital business
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="st-focus rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
          >
            ← New idea
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
          <label className="flex items-center gap-1.5 text-xs text-white/80">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="accent-st-teal"
            />
            Only mine
          </label>
          <select value={team} onChange={(e) => setTeam(e.target.value)} className={inputCls}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t} value={t} className="text-st-navy">
                {t}
              </option>
            ))}
          </select>
          <select value={system} onChange={(e) => setSystem(e.target.value)} className={inputCls}>
            <option value="">All systems</option>
            {systems.map((s) => (
              <option key={s} value={s} className="text-st-navy">
                {s}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!persistent && (
        <div className="rounded-xl border border-st-gold/40 bg-st-gold/10 px-4 py-2.5 text-xs text-[#9a6c0a]">
          <strong>Demo storage.</strong> Ideas aren&apos;t durably saved yet — connect a database
          (Vercel → Storage → Create Postgres) and they persist and aggregate across everyone with
          zero code changes.
        </div>
      )}

      {loading ? (
        <div className="st-card p-8 text-center text-sm text-slate-400">Loading portfolio…</div>
      ) : failed ? (
        <div className="st-card p-8 text-center text-sm text-red-500">Couldn&apos;t load the portfolio.</div>
      ) : ideas.length === 0 ? (
        <div className="st-card p-8 text-center text-sm text-slate-500">
          No ideas captured yet. Run a discovery chat and hit{" "}
          <span className="font-medium text-st-teal-600">Save to portfolio</span>.
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Ideas" value={String(summary.count)} />
            <Stat label="Hours / year" value={summary.totalYearlyHours.toLocaleString()} />
            <Stat label="Annual saving" value={formatGBP(summary.totalYearlyCostGBP)} accent />
            <Stat
              label="Avg / idea"
              value={formatGBP(summary.count ? summary.totalYearlyCostGBP / summary.count : 0)}
            />
          </section>

          <div className="flex flex-col gap-5 lg:flex-row">
            <section className="st-card p-5 lg:w-72 lg:shrink-0">
              <h2 className="st-eyebrow mb-3">By team</h2>
              <ul className="space-y-2.5">
                {summary.byTeam.map((t) => (
                  <li key={t.team}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-st-navy">{t.team}</span>
                      <span className="text-slate-400">{formatGBP(t.yearlyCostGBP)}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-st-teal to-st-cyan"
                        style={{ width: `${(t.yearlyCostGBP / maxTeamCost) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              {summary.bySystem.length > 0 && (
                <>
                  <h2 className="st-eyebrow mb-2 mt-5">Top systems</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.bySystem.slice(0, 10).map((s) => (
                      <span
                        key={s.system}
                        className="rounded-full bg-st-teal/10 px-2.5 py-1 text-xs font-medium text-st-teal-600 ring-1 ring-inset ring-st-teal/20"
                      >
                        {s.system} · {s.count}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>

            <section className="st-card flex-1 overflow-hidden p-0">
              <h2 className="st-eyebrow border-b border-slate-100 px-5 py-3.5">
                Ideas ranked by value
              </h2>
              <div className="st-scroll overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-2.5 font-medium">Idea</th>
                      <th className="px-3 py-2.5 font-medium">Team</th>
                      <th className="px-3 py-2.5 text-right font-medium">Hrs/yr</th>
                      <th className="px-3 py-2.5 text-right font-medium">£/yr</th>
                      <th className="px-5 py-2.5 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filtered]
                      .sort((a, b) => b.roi.yearlyCostGBP - a.roi.yearlyCostGBP)
                      .map((i) => (
                        <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                          <td className="px-5 py-3">
                            <div className="font-medium text-st-navy">{i.title}</div>
                            <div className="text-[11px] text-slate-400">
                              {STATUS_LABEL[i.status] ?? i.status}
                              {i.ownerId === owner ? " · yours" : ""}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-500">{i.team || "—"}</td>
                          <td className="px-3 py-3 text-right tabular-nums text-st-navy">
                            {i.roi.yearlyHours.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold tabular-nums text-st-teal-600">
                            {formatGBP(i.roi.yearlyCostGBP)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link
                              href={`/?idea=${i.id}`}
                              className="text-xs font-medium text-st-teal-600 hover:underline"
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="st-card p-4">
      <div
        className={`font-display text-2xl font-semibold ${accent ? "text-st-teal-600" : "text-st-navy"}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
