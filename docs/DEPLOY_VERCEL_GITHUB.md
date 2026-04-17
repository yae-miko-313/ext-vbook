# Deploy Guide: Vercel Backend + GitHub Pages Frontend

This guide covers the deployment of the newly updated V4 Unified Edge Cache Catalog API on Vercel, alongside the static Frontend UI deployed via GitHub Pages.

## Architecture V4 (Tiered Cache)

The system now operates completely independently of static `json` fallback files, instead leveraging extremely fast Serverless features. 

- **Frontend**: GitHub Pages serves files in `web/` locally in browser.
- **Backend**: Vercel serves the `/api/` logic to perform aggregate gathering and parsing logic.
- **Data Source**: `web/remote-sources.json` or `.private/references/remote-sources.json`.

### Tiered Cache & Sync Flow
The **VBook V4 Backend** utilizes a highly optimized strategy to ensure sub-50ms API delivery:
1. **Tier 1 (Mem Cache)**: Handles identical hits within the exact same lambda container `< 1ms`.
2. **Tier 2 (KV Cache)**: Relies on `Vercel KV` (Redis-powered) to persist the system's full JSON state across all deployments and cold starts. Takes `< 50ms`.
3. **Tier 3 (Cold Sync)**: Scrapes all remote sources defined in `remote-sources.json` instantly on total KV misses, guaranteeing UI rendering within `~1-2s`.
4. **Background Health Task**: A separate thread isolates the `checkSiteHealth` scanner to non-blocking `waitUntil()`. Once resolved, the backend silently updates the Edge cache without delaying initial user connections, while frontend `patchHealthBadges` silently patches in `DIE, LIVE, MOVE` statuses moments later.

## 1. Prepare Repository

Required backend routines are already pre-packaged in this repo:
- `api/plugin.json.js`
- `api/catalog.json.js`
- `api/health.js`
- `api/_lib/live-catalog.js`

## 2. Deploy Backend to Vercel

1. Create a new Vercel project from this repository.
2. Framework preset: `Other`.
3. Root directory: repository root (Leave empty!).
4. Build command: leave empty. 
5. Ensure `vercel.json` at repo root is detected!
6. Add environment variables:
   - `VBOOK_ALLOWED_ORIGIN=https://<username>.github.io`
   - `VBOOK_WEB_FETCH_TIMEOUT_MS=12000`
   - **`KV_REST_API_URL`**: [REQUIRED] Generated via Vercel Storage KV setup.
   - **`KV_REST_API_TOKEN`**: [REQUIRED] Generated via Vercel Storage KV setup.

7. Deploy.

After deploy, verify speed via:
- `https://<vercel-domain>/api/plugin.json` 
- `https://<vercel-domain>/api/catalog.json`

## 3. Deploy Frontend to GitHub Pages

Publish `web/` to GitHub Pages.

Use the `?catalog` variable to link your specific frontend to the backend instance:
```text
https://<username>.github.io/<repo>/?catalog=https://<vercel-domain>/api/plugin.json
```

## 4. Troubleshooting (Lessons Learned)

### "remote-sources.json is missing or invalid"
Vercel serverless apps are compiled using `nft` (Node File Trace), which uses literal AST extraction to bundle files alongside Edge logic. By default, Vercel **ignores dynamically accessed files**!
- If you refactor code, `require('../../web/remote-sources.json')` **MUST** be written literally (explicit string interpolation). 
- Avoid using `fs.readFileSync(path.join(__dirname, relative))` since dynamically generated paths are blind to Vercel's bundler and will fail in production.

### API Slowdowns over 5s
- The backend might not be properly writing to Vercel KV, forcing every user connection to trigger a Tier-3 Cold Sync.
- Double check that `KV_REST_API_TOKEN` is correctly paired to the active environment! 
- If Cloudflare heavily throttles a domain during initial setup, remove it from `remote-sources.json` to prevent lambda hanging.

### Missing Health Badges on Interface
- The UI triggers `fetchAppData(true)` 5 seconds after page load. This asks the `/api/health.js` for new background data.
- If KV is down, health scans running in the background `waitUntil` will fail to persist states for the UI. Check Vercel logs under the label `[Refresh]`.
