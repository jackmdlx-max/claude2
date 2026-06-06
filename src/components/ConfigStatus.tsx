"use client";

import { useEffect, useState } from "react";

interface Health {
  chat_ready: boolean;
  demo: boolean;
  image_ready: boolean;
  model: string;
}

/**
 * Small badge that surfaces deployment config (live engine, scripted demo, or
 * missing key — and which model) so a user isn't surprised by their first turn.
 */
export function ConfigStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;
  if (!health) return null;

  // Scripted walkthrough — no API key needed, no cost.
  if (health.demo) {
    return (
      <div
        className="flex shrink-0 items-center gap-2 rounded-lg border border-st-sky/40 bg-st-sky/10 px-3 py-1.5 text-xs"
        title="Capital AI Idea Generation is running a scripted walkthrough — no API key needed. Set ANTHROPIC_API_KEY in your environment to switch on live AI."
      >
        <span className="h-2 w-2 rounded-full bg-st-sky" />
        <span className="font-medium text-st-blue">Demo mode</span>
      </div>
    );
  }

  const ok = health.chat_ready;
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
      title={
        ok
          ? `Model: ${health.model}${health.image_ready ? " · image gen enabled" : ""}`
          : "Set ANTHROPIC_API_KEY in .env.local"
      }
    >
      <span
        className={[
          "h-2 w-2 rounded-full",
          ok ? "bg-emerald-500" : "bg-st-gold",
        ].join(" ")}
      />
      <span className={ok ? "text-slate-500" : "font-medium text-st-gold"}>
        {ok ? "Engine ready" : "API key not set"}
      </span>
    </div>
  );
}
