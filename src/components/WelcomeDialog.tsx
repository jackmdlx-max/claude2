"use client";

import { useState } from "react";

export interface Profile {
  name: string;
  role: string;
  team: string;
}

interface Props {
  savedExists: boolean;
  defaults: Profile;
  onStart: (p: Profile) => void;
  onResume: () => void;
}

/**
 * Gate shown when the app loads. Captures who's using it (so the engine can skip
 * the warm-up and the pipeline knows who submitted), and ensures each new person
 * starts a fresh session rather than seeing the previous person's conversation.
 */
export function WelcomeDialog({ savedExists, defaults, onStart, onResume }: Props) {
  const [name, setName] = useState(defaults.name);
  const [role, setRole] = useState(defaults.role);
  const [team, setTeam] = useState(defaults.team);

  const fieldCls =
    "st-focus mb-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-st-navy";
  const labelCls = "mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-st-ink/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-lg">
        <h2 className="font-display text-lg font-semibold text-st-navy">Welcome to Capital AI</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          A quick intro so we can tailor the session and tag your idea — then we&apos;ll get
          straight into your bottleneck.
        </p>

        <label className={labelCls}>Your name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sam Okafor"
          className={fieldCls}
          autoFocus
        />
        <label className={labelCls}>Your role</label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Process engineer"
          className={fieldCls}
        />
        <label className={labelCls}>Your team</label>
        <input
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="e.g. Wastewater capital delivery"
          className={fieldCls}
        />

        <button
          onClick={() => onStart({ name: name.trim(), role: role.trim(), team: team.trim() })}
          disabled={!role.trim()}
          className="st-focus mt-1 w-full rounded-lg bg-st-teal px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-st-teal-600 disabled:opacity-40"
        >
          Start a new idea
        </button>

        {savedExists && (
          <button
            onClick={onResume}
            className="st-focus mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-50"
          >
            Resume my previous session
          </button>
        )}
      </div>
    </div>
  );
}
