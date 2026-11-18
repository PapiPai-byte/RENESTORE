# ReneStore deployment notes

The application has separate frontend, backend, and PostgreSQL components. Choose hosting providers that support the required Node.js runtime and PostgreSQL connectivity.

## Configure the deployment

- Deploy `Backend` as a Node.js service and configure `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, and any integration keys in the provider's secret manager.
- Deploy `Frontend` as a static Vite application. Set `VITE_API_URL` to the deployed backend API URL and `VITE_USE_MOCK=false` to use the database-backed API.
- Use private, environment-specific credentials. Never commit secrets, paste production credentials into documentation, or reuse credentials from older setup notes.
- Restrict database access to the application and authorized operators. Back up the database before schema changes.

## Database release sequence

1. Review the migration files and back up the target database.
2. Apply the schema using `cd Backend` and `npm run db:migrate`.
3. If authentic source data is ready, run `npm run import:data` from `Backend`; the importer reads CSVs from `Backend/data/import` and does not fabricate records or truncate tables.
4. Verify table counts, date ranges, data sources, and the admin analytics pages before enabling the release.

For local development and environment-variable references, follow the root [README](README.md). Hosting-specific commands and dashboard URLs depend on your selected provider and are intentionally not hardcoded here.
