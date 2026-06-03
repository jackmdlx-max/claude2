const STAGES = ["Context", "Discovery", "Validation", "Pitch"] as const;

/**
 * Horizontal 4-step progress bar mirroring the engine's conversational stages.
 * `stage` is 1-based (1 = Context … 4 = Pitch).
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
                    ? "bg-st-blue text-white"
                    : active
                      ? "bg-st-gold text-white"
                      : "bg-slate-200 text-slate-400",
                ].join(" ")}
              >
                {done ? "✓" : step}
              </span>
              <span
                className={[
                  "text-xs font-medium transition",
                  active ? "text-st-navy" : done ? "text-st-blue" : "text-slate-400",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {step < STAGES.length && (
              <span className={["h-px flex-1", done ? "bg-st-blue" : "bg-slate-200"].join(" ")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
