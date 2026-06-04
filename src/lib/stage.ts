/**
 * Conversational stage derivation, kept pure so it can be unit-tested
 * independently of React state.
 *
 *   1 Context · 2 Discovery · 3 Validation · 4 Pitch
 *
 * The stage is inferred from the strongest signal available in the latest
 * envelope and never regresses (a momentarily-null draft on a later turn
 * shouldn't drag the indicator backwards).
 */
export interface StageSignals {
  hasMockup: boolean;
  hasDraft: boolean;
  userTurns: number;
}

export function deriveStage(previous: number, signals: StageSignals): number {
  let next = 1;
  if (signals.hasMockup) next = 4;
  else if (signals.hasDraft) next = 3;
  else if (signals.userTurns >= 1) next = 2;
  return Math.max(previous, next);
}
