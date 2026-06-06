"use client";

import { useState } from "react";
import type { BusinessCaseDraft, ChatMessage, SolutionDesign } from "@/lib/types";
import { getOwnerId } from "@/lib/owner";

interface Props {
  ideaId: string | null;
  draft: BusinessCaseDraft | null;
  solutionDesign: SolutionDesign | null;
  mockupPrompt: string | null;
  messages: ChatMessage[];
  stage: number;
  onSaved: (id: string) => void;
  className?: string;
}

/**
 * Saves the current session to the portfolio. Opens a small inline dialog for a
 * title + team, then POSTs to /api/ideas (upsert by id so re-saving updates).
 */
export function SaveIdeaButton({
  ideaId,
  draft,
  solutionDesign,
  mockupPrompt,
  messages,
  stage,
  onSaved,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [team, setTeam] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  function start() {
    setTitle(title || (draft?.bottleneck ? String(draft.bottleneck).slice(0, 80) : ""));
    setError(null);
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-owner-id": getOwnerId() },
        body: JSON.stringify({
          id: ideaId ?? undefined,
          title,
          team,
          draft,
          solutionDesign,
          mockupPrompt,
          messages,
          stage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Save failed.");
      onSaved(data.idea.id);
      setOpen(false);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1800);
      if (data.persistent === false) {
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button onClick={start} className={className}>
        {savedTick ? "Saved ✓" : ideaId ? "Update idea" : "Save to portfolio"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-st-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-card-lg">
            <p className="mb-3 text-sm font-semibold text-st-navy">Save to portfolio</p>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short name for this idea"
              className="st-focus mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-st-navy"
              autoFocus
            />
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Team (optional)
            </label>
            <input
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              placeholder="e.g. Pipeline rehab"
              className="st-focus mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-st-navy"
            />
            {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !title.trim()}
                className="st-focus rounded-lg bg-st-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-st-teal-600 disabled:opacity-40"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
