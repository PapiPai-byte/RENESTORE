# ReneStore deployment notes

The repository supports two deployment layouts:

- A single Vercel project with `backend` and `frontend` services, configured by the root `vercel.json`.
- A separate Vercel frontend and Render backend. Set Vercel's Root Directory to `Frontend`; `Frontend/vercel.json` provides the SPA fallback so refreshing client-side routes serves `index.html`.

## Vercel Services

- Set the Vercel project's Root Directory to the repository root so Vercel can read `vercel.json`.
- Set `VITE_API_URL=/api` and `VITE_USE_MOCK=false` for the frontend's Production environment.
- Configure backend variables in Vercel: `DATABASE_URL` (the Neon connection string), strong unique `JWT_SECRET` and `JWT_REFRESH_SECRET` values, `CLIENT_URL` (the exact production Vercel origin), `NODE_ENV=production`, and any integration keys such as `GROQ_API_KEY`.
- Do not set `PORT`; Vercel supplies runtime configuration.
- The frontend makes browser requests through the public `/api/*` rewrite, so no service binding is needed. The backend calls Neon and other external services directly.
- The backend currently validates request origins against the exact `CLIENT_URL`; preview deployments need their origin explicitly supported before mutating API requests will work there.
- Use private, environment-specific credentials. Never commit secrets, paste production credentials into documentation, or reuse credentials from older setup notes.
- Restrict database access to the application and authorized operators. Back up the database before schema changes.

For the separate Render backend layout, set the frontend's `VITE_API_URL` to the full Render API URL ending in `/api`, such as `https://your-service.onrender.com/api`; do not use `/api` alone. Set Render's `CLIENT_URL` to the exact Vercel site origin.

## Database release sequence

1. Review the migration files and back up the target database.
2. Apply the schema using `cd Backend` and `npm run db:migrate` with `DATABASE_URL` pointing to the target Neon database.
3. If authentic source data is ready, run `npm run import:data` from `Backend`; the importer reads CSVs from `Backend/data/import` and does not fabricate records or truncate tables.
4. Verify table counts, date ranges, data sources, and the admin analytics pages before enabling the release.

For local development and environment-variable references, follow the root [README](README.md). Hosting-specific commands and dashboard URLs depend on your selected provider and are intentionally not hardcoded here.
