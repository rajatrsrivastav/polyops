# Packbay API

See ../README.md for setup and ../docs/api-contract.md for routes. `npm run check` runs lint, strict TypeScript, real-Mongo tests and a production build. app.ts exports an app factory without listen; index.ts validates environment, initializes Firebase, connects Mongo and starts HTTP. Services own business logic. Scripts require privately supplied environment values and never load the old root environment file.
