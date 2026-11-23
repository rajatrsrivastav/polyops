# ADR 0004: Offset pagination for initial shops

Date: 19 November 2026. Status: implemented AI draft, awaiting Rajat review.

## Context

Owners and staff need bounded lists.

## Options considered

Cursor pagination scales deeper lists but complicates page navigation. Unbounded lists are excluded.

## Decision

Use page/limit capped at 50 and stable createdAt/_id ordering; cap page at 10000.

## Consequences

Deep offset pages become expensive; measure tenant sizes before revisiting.

## Evidence

AC12 query validation plus list behavior.
