# Deploying to Render

Both the API and the UI deploy from this repository with the blueprint in [`render.yaml`](../render.yaml).
The free plan is enough for a demo.

## One-time setup (about 10 minutes)

1. Sign in at https://render.com (the "Sign in with GitHub" option is easiest) and allow access to the
   `acme-salary` repository.
2. **New, then Blueprint**, choose the repository, and click **Apply**. Render creates two services:
   `acme-salary-api` (Rails) and `acme-salary-ui` (Next.js). Both will start building.
3. The first UI build will fail or point nowhere until the two URLs are known, so set them next:
   - On **acme-salary-api**, open **Environment** and set `FRONTEND_ORIGINS` to the UI's address, for example
     `https://acme-salary-ui.onrender.com` (no trailing slash).
   - On **acme-salary-ui**, open **Environment** and set `NEXT_PUBLIC_API_URL` to the API's address, for example
     `https://acme-salary-api.onrender.com` (no trailing slash).
   - If a name was already taken, Render adds a suffix; use the exact URL shown at the top of each service page.
4. Redeploy the UI (**Manual Deploy, then Deploy latest commit**). `NEXT_PUBLIC_API_URL` is baked in at build
   time, so the UI must be rebuilt after it is set. Saving the API variable restarts the API automatically.
5. Open the UI's URL. The Employees page should list people.

## What to know

- **First load can take about a minute.** Free services sleep after inactivity and wake on the next request.
  Open both URLs a minute before a demo.
- **The data resets on every restart.** The free plan's disk is temporary and the app uses SQLite, so each start
  recreates 10,000 employees from the deterministic seed (about a second). Edits made during a demo are lost on
  the next restart or redeploy. To keep data, attach a persistent disk and set `DATABASE_PATH` to a path on it,
  or move to PostgreSQL.
- **No login.** Anyone with the URL can see and change the data. This is stated as a limitation in the design
  notes; do not put real salary data here.

## Checks

- API health: `https://<api-url>/up` returns 200.
- API data: `https://<api-url>/api/v1/insights/summary` returns JSON with `headcount` near 9,384.
- Browser console errors mentioning CORS mean `FRONTEND_ORIGINS` does not exactly match the UI's address
  (scheme, host, no trailing slash).

## Verified locally before deploying

The production start sequence from `render.yaml` was run on this repository in production mode: it created the
database, seeded 10,000 employees in about 0.3 s, answered `/up` and the API with 200, allowed CORS only from the
configured UI origin, and behaved correctly behind a TLS-terminating proxy. That run found and fixed a missing
production database path (now covered by a test). It was not run on Render itself.

## Running the same thing locally

See the [README](../README.md).
