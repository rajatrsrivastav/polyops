# ADR 0003: Mongo roles after Firebase verification

Date: 19 November 2026. Status: implemented AI draft, awaiting Rajat review.

## Context

Firebase identities must not choose their own shop or privilege.

## Options considered

Custom claims avoid a lookup but can remain stale; request-supplied roles are untrusted.

## Decision

Verify Firebase ID tokens with revocation checks, then load a provisioned User by UID. Role/shop come from Mongo.

## Consequences

A Mongo lookup and Firebase revocation check add latency. Unknown users receive 403. Outages fail closed.

## Evidence

AC8–AC11 and AC20.
