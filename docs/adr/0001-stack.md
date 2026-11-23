# ADR 0001: Stack and repo layout

Date: 19 November 2026. Historical decision. For current technology and deployment decisions see [Architecture](../architecture.md) and the [operating runbook](../runbook.md).

## Context

Three independent applications share one REST contract.

## Options considered

A workspace manager simplifies root installs but adds configuration; separate npm packages keep responsibilities clear.

## Decision

Use the playbook’s Express/TypeScript/Mongoose, Vite/React, and Expo stack. No monorepo framework.

## Consequences

Each package owns a lockfile and checks. Root commands delegate.

## Evidence

All package checks and production bundles.
