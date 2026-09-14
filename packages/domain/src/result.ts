/**
 * Re-exports neverthrow + helpers. Domain never throws — it returns Result<T, E>.
 * This is the 2026 standard for typed error handling in TS.
 */
import { err, ok, Result } from "neverthrow";

export { ok, err, Result };

export type DomainError =
  | { readonly kind: "ValidationFailed"; readonly message: string; readonly field?: string }
  | { readonly kind: "InvalidTransition"; readonly from: string; readonly to: string; readonly reason: string }
  | { readonly kind: "InvariantBroken"; readonly invariant: string; readonly message: string }
  | { readonly kind: "NotFound"; readonly entity: string; readonly id: string };

export const domainError = {
  validation: (message: string, field?: string): DomainError => ({
    kind: "ValidationFailed",
    message,
    ...(field !== undefined ? { field } : {}),
  }),
  transition: (from: string, to: string, reason: string): DomainError => ({
    kind: "InvalidTransition",
    from,
    to,
    reason,
  }),
  invariant: (invariant: string, message: string): DomainError => ({
    kind: "InvariantBroken",
    invariant,
    message,
  }),
  notFound: (entity: string, id: string): DomainError => ({
    kind: "NotFound",
    entity,
    id,
  }),
} as const;

