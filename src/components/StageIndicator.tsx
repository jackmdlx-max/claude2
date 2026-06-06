const STAGES = ["Context", "Discovery", "Validation", "Solution"] as const;

/**
 * Horizontal 4-step stepper mirroring the engine's conversational stages,
 * styled for the dark hero header. `stage` is 1-based (1 = Context … 4).
 */
export function StageIndicator({ stage }: { stage: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STAGES.map((label, i) => {
        const step = i + 1;
        const done = step < stage;
        const active = step === stage;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition",
                  done
                    ? "bg-st-teal text-white"
                    : active
                      ? "bg-st-gold text-st-ink animate-pulse-glow"
                      : "bg-white/10 text-white/45 ring-1 ring-inset ring-white/15",
                ].join(" ")}
              >
                {done ? "✓" : step}
              </span>
              <span
                className={[
                  "hidden text-xs font-medium transition sm:inline",
                  active ? "text-white" : done ? "text-st-teal-300" : "text-white/45",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {step < STAGES.length && (
              <span
                className={[
                  "h-px flex-1 transition",
                  done ? "bg-st-teal/70" : "bg-white/12",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
