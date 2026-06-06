"use client";

import { useEffect, useState } from "react";

interface MockupState {
  loading: boolean;
  imageUrl: string | null;
  prompt: string | null;
}

/**
 * Renders the Stage 4 UI mockup. Tries to generate an image via /api/mockup;
 * if no image backend is configured it shows the prompt as a clean schematic
 * "spec card" so the data flow is still communicated.
 */
export function MockupPanel({ prompt }: { prompt: string | null }) {
  const [state, setState] = useState<MockupState>({
    loading: false,
    imageUrl: null,
    prompt: null,
  });

  useEffect(() => {
    if (!prompt) {
      setState({ loading: false, imageUrl: null, prompt: null });
      return;
    }
    let cancelled = false;
    setState({ loading: true, imageUrl: null, prompt });
    fetch("/api/mockup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })
      .then((r) => r.json())
      .then((data: { image_url?: string }) => {
        if (cancelled) return;
        setState({ loading: false, imageUrl: data.image_url ?? null, prompt });
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, imageUrl: null, prompt });
      });
    return () => {
      cancelled = true;
    };
  }, [prompt]);

  if (!prompt) {
    return (
      <div className="rounded-2xl border border-dashed border-st-teal/30 bg-white/50 p-5 text-sm text-st-slate/60">
        A rendered UI mockup of the proposed automation will appear here at the
        recommendation stage.
      </div>
    );
  }

  return (
    <div className="st-card animate-fade-in-up p-5">
      <h2 className="st-eyebrow mb-4">UI Design Mockup</h2>

      {state.loading && (
        <div className="flex h-48 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
          Generating schematic…
        </div>
      )}

      {!state.loading && state.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.imageUrl}
          alt="Generated automation data-flow mockup"
          className="w-full rounded-lg border border-slate-200"
        />
      )}

      {!state.loading && !state.imageUrl && (
        <div className="space-y-3">
          <div className="rounded-lg border border-st-blue/20 bg-st-blue/5 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-st-blue">
              Schematic spec
            </p>
            <p className="text-sm leading-relaxed text-st-navy">{prompt}</p>
          </div>
          <p className="text-xs text-slate-400">
            No image backend configured — set <code>OPENAI_API_KEY</code> (see
            <code> .env.example</code>) to render this prompt as a generated
            diagram.
          </p>
        </div>
      )}
    </div>
  );
}
