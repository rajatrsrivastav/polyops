# ADR 0002: Atomic stock reservation

Date: 19 November 2026. Status: implemented AI draft, awaiting Rajat review.

## Context

A multi-item order must never leave a partial reservation.

## Options considered

Conditional updates alone prevent one-item oversell but do not roll back earlier items. Optimistic stockVersion adds retries and still needs multi-item consistency.

## Decision

Use a replica-set transaction and conditional stock decrements; insert movements and the order in that transaction.

## Consequences

Replica-set infrastructure is mandatory. Transaction callbacks may rerun and contain no external effects.

## Evidence

AC16 rollback and AC17 concurrent last-unit orders.
