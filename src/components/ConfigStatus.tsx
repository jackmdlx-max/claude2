"use client";

import { useEffect, useState } from "react";

interface Health {
  chat_ready: boolean;
  image_ready: boolean;
  model: string;
}

/**
 * Small badge that surfaces deployment config (is the Claude key set? which
 * model?) so a user isn't surprised by an error on their first message.
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
