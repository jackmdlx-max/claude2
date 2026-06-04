"use client";

/** App-level error boundary: keeps a render crash from blanking the screen. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex h-screen items-center justify-center p-6">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="mb-2 text-lg font-semibold text-st-navy">Something went wrong</h1>
        <p className="mb-4 text-sm text-slate-500">
          ST-Streamline hit an unexpected error. Your saved session is intact —
          try again.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-st-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-st-navy"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
