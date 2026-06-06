/**
 * A lightweight anonymous owner id (kept in localStorage) so "My ideas" can be
 * scoped to this browser until real SSO is added. Sent as the `x-owner-id`
 * header on idea writes/reads.
 */
const KEY = "capital-ai:owner:v1";

export function getOwnerId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `o_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}
