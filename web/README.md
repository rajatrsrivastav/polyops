# PolyOps factory owner dashboard

`npm ci`, configure VITE_API_URL with the factory API origin, then `npm run dev`. API URL is the origin without /api. Vite variables must be present when building. `npm run check` runs lint/types/helper tests/production build. No fake authenticated workspace or local auth bypass is included. Deploy with web/ as Vercel root; vercel.json supports client-side routing. Privacy text is imported directly from ../docs/privacy.md.
