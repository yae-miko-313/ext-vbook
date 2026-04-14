# Deploy Guide: Vercel Backend + GitHub Pages Frontend

This guide deploys dynamic catalog APIs on Vercel and static UI on GitHub Pages.

## Architecture

- Frontend: GitHub Pages serves files in `web/`
- Backend: Vercel serves dynamic APIs in `api/`
- Data source: `references/remote-sources.json`

Dynamic endpoints:
- `/api/plugin.json`
- `/api/catalog.json`
- `/api/remote-sources.json`

## 1. Prepare Repository

Required files are already in this repo:
- `api/plugin.json.js`
- `api/catalog.json.js`
- `api/remote-sources.json.js`
- `api/_lib/live-catalog.js`
- `tools/cli/build/serve-web-catalog.js`

Optional local checks:

```bash
npm run sync:web-catalog
```

`sync:web-catalog` hiện đã bao gồm bước sync health (`sync:health:all`).

CI-safe sync for GitHub Pages workflow:

```bash
npm run full-sync:ci
```

## 2. Deploy Backend to Vercel

1. Create a new Vercel project from this repository.
2. Framework preset: `Other`.
3. Root directory: repository root.
4. Build command: leave empty.
5. Output directory: leave empty.
6. Ensure `vercel.json` at repo root is used (already added in this project).
7. Add environment variables:

- `VBOOK_ALLOWED_ORIGIN=https://<username>.github.io`
- `VBOOK_WEB_CACHE_TTL_MS=15000`
- `VBOOK_WEB_FETCH_TIMEOUT_MS=12000`

8. Deploy.

After deploy, verify:

- `https://<vercel-domain>/api/plugin.json`
- `https://<vercel-domain>/api/catalog.json`
- `https://<vercel-domain>/api/remote-sources.json`

## 3. Deploy Frontend to GitHub Pages

Publish `web/` to GitHub Pages as usual.

Use catalog query to load backend dynamic aggregate:

```text
https://<username>.github.io/<repo>/?catalog=https://<vercel-domain>/api/plugin.json
```

Notes:
- With `?catalog=...`, the viewer reads aggregate from backend URL.
- Copy Link Tong will copy the backend URL when `?catalog=...` is present.

## 4. Health + Sync Workflow

Use these when you want to refresh static fallback artifacts:

```bash
npm run sync:web-catalog
```

This does not replace Vercel dynamic APIs. It keeps `web/plugin.json`, `web/catalog.json`, and `web/site-health.json` fresh as fallback.

## 5. Troubleshooting

### CORS blocked in browser

- Ensure `VBOOK_ALLOWED_ORIGIN` matches your GitHub Pages origin exactly.
- Redeploy Vercel after changing env vars.

### API timeout on Vercel

- Reduce number of remote sources or increase timeouts moderately.
- Tune cache with `VBOOK_WEB_CACHE_TTL_MS`.

### `references/remote-sources.json is missing or invalid`

- Ensure `references/remote-sources.json` exists and is valid JSON.
- Ensure `vercel.json` includes this file in function bundle:
	- `"functions": { "api/**/*.js": { "includeFiles": "references/remote-sources.json" } }`
- Redeploy after commit/push because serverless bundle is rebuilt on each deploy.

### Vercel deploy fails when using root

- Use project root as Root Directory (not `api/`).
- Keep Build Command empty.
- Confirm `vercel.json` exists in repo root and includes `api/**/*.js` functions.
- If this repo has a `build` script for other purposes, force backend-only deploy by setting:
	- `"framework": null`
	- `"buildCommand": ""`
	in `vercel.json` so Vercel does not expect a static output directory.

### Copy Link Tong still points to GitHub Pages plugin.json

- Open frontend with `?catalog=https://<vercel-domain>/api/plugin.json`.
- Hard refresh the page.

## 6. Recommended Production URL

Use this as the share URL:

```text
https://<username>.github.io/<repo>/?catalog=https://<vercel-domain>/api/plugin.json
```

That gives:
- Static UI from GitHub Pages
- Dynamic all-in-one `plugin.json` from Vercel

## 7. Backend API Contract (Vercel)

Endpoints:

- `GET /api/plugin.json`: aggregate root (`metadata`, `referenceListUrl`, `data[]`)
- `GET /api/catalog.json`: sidecar by source (`metadata`, `summary`, `referenceListUrl`, `sources[]`)
- `GET /api/remote-sources.json`: normalized source list (`generatedAt`, `source`, `referenceListUrl`, `sources[]`)

Method behavior:

- `GET` → `200`
- `OPTIONS` (preflight) → `204`
- Methods khác → `405` (`{ "error": "Method Not Allowed" }`)
- Runtime/fetch lỗi → `500` (`{ "error": "..." }`)

CORS/env:

- `VBOOK_ALLOWED_ORIGIN` hỗ trợ 1 hoặc nhiều origin (comma-separated), và wildcard host kiểu `*.domain.com`

Cache/timeout env:

- `VBOOK_WEB_CACHE_TTL_MS`
- `VBOOK_WEB_FETCH_TIMEOUT_MS`

Dedupe item key:

1. `path`
2. fallback `name|author|source|type`
