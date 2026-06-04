/**
 * ROI maths for ST-Streamline.
 *
 * We deliberately mirror the engine's own convention from the system prompt
 * (monthly = weekly hours * 4; yearly = monthly * 12) so the numbers shown in
 * the UI never contradict the figures the model talks about in chat.
 */
export const WEEKS_PER_MONTH = 4;
export const MONTHS_PER_YEAR = 12;

/** Assumed fully-loaded hourly rate (GBP) used when none is supplied. */
export const DEFAULT_LOADED_HOURLY_RATE_GBP = 30;

export interface RoiInputs {
  /** Hours one person loses to the task each week. */
  hoursPerWeek?: number | null;
  /** Number of people repeating the task (defaults to 1). */
  peopleAffected?: number | null;
  /** Fully-loaded hourly rate in GBP (defaults to DEFAULT_LOADED_HOURLY_RATE_GBP). */
  hourlyRate?: number | null;
}

export interface RoiResult {
  weeklyHours: number;
  monthlyHours: number;
  yearlyHours: number;
  yearlyCostGBP: number;
  /** The rate actually used for the cost figure (input or default). */
  rateUsed: number;
}

/** Coerce an unknown value to a finite, non-negative number (else 0). */
export function toNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0;
}

export function computeRoi(inputs: RoiInputs): RoiResult {
  const perPerson = toNumber(inputs.hoursPerWeek);
  const people = Math.max(1, toNumber(inputs.peopleAffected) || 1);
  const weeklyHours = perPerson * people;
  const monthlyHours = weeklyHours * WEEKS_PER_MONTH;
  const yearlyHours = monthlyHours * MONTHS_PER_YEAR;

  const rate = toNumber(inputs.hourlyRate);
  const rateUsed = rate > 0 ? rate : DEFAULT_LOADED_HOURLY_RATE_GBP;
  const yearlyCostGBP = yearlyHours * rateUsed;

  return { weeklyHours, monthlyHours, yearlyHours, yearlyCostGBP, rateUsed };
}

/** Format a GBP amount with no decimals and thousands separators. */
export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}
