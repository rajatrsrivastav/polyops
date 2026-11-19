# ADR 0005: Reserve at order creation

Date: 19 November 2026. Status: implemented AI draft, awaiting Rajat review.

## Context

Packing must reflect stock already promised to customers.

## Options considered

Reserving at pack permits multiple orders for the same units; reserving at ship delays the conflict further.

## Decision

Reserve when the owner creates an order. Cancel from pending/packed to return stock transactionally.

## Consequences

Abandoned pending orders tie up stock; owner must cancel intentionally. Staff cannot cancel.

## Evidence

AC15, AC19 and AC21.
