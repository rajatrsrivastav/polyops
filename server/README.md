# PolyOps API

The Express API manages material stock, buyer order reservations and dispatch for a plastics factory. Better Auth handles sign-in and Postgres stores factory-scoped records. The weekly brief uses aggregate operational figures.

Run `npm run check` from this directory for lint, strict TypeScript checks, PGlite integration tests and a production build. The seed supports a quick synthetic factory dataset with eight materials and fourteen buyer orders. Reseeding replaces the existing demo workspace’s data. See the [setup guide](../README.md) and [API contract](../docs/api-contract.md).
