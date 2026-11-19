# ADR 0006: Optional grounded weekly brief

Date: 19 November 2026. Status: implemented AI draft, awaiting Rajat review.

## Context

An AI summary must not drive order correctness or expose contacts.

## Options considered

A plain template is safer and cheaper but less expressive; sending full orders is unnecessary and excluded.

## Decision

Send aggregate JSON only; validate structure and numbers; cache once per week; use a Mongo lease and template fallback.

## Consequences

Text validation is not a semantic proof of every generated sentence. The UI displays source figures and identifies the provider. Review generated text; prefer template if stronger assurance is needed.

## Evidence

AC24–AC27 and mocked provider tests.
