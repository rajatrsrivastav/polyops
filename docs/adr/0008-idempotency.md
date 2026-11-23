# ADR 0008: Content-bound retry identities

Date: 19 November 2026. Status: implemented AI draft, awaiting Rajat review.

## Context

A timed-out create or delivery can otherwise apply twice.

## Options considered

A compound sparse index is incorrect when shopId always exists. Client-only disabled buttons do not protect retries.

## Decision

Use optional per-shop UUID keys with partial unique indexes and normalized request hashes; retain keys across uncertain client retries.

## Consequences

Same-key/different-content returns 409. Archived snapshots and cached responses preserve the original result.

## Evidence

AC14, AC18 and receipt conflict/concurrency hardening tests.
