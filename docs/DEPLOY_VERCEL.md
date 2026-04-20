# Deploy Guide: Unified Vercel (Frontend + Backend)

This guide covers the deployment of the VBook Tool on Vercel, hosting both the **Static Frontend UI** (`web/`) and the **Serverless API** (`api/`) under a single domain.

## Architecture Unified (Unified Domain)

The system is designed for high performance and low maintenance by serving both components from the same Vercel project using `vercel.json` rewrites.

- **Frontend**: Served from the `web/` directory. Accessible at the root `/`.
- **Backend**: Served from the `api/` directory. Accessible at `/api/*`.
- **Data Source**: Configured via `web/remote-sources.json`.
- **Domain**: Recommended to use a custom domain like `vbookext.me`.

## 1. Prepare Repository

Required components are pre-packaged:
- **API**: `api/*.js` (Serverless functions)
- **Frontend**: `web/*` (HTML, CSS, JS)
- **Routing**: `vercel.json` at the repo root.

## 2. Deploy to Vercel

1. Create a new Vercel project from this repository.
2. Framework preset: **Other**.
3. Root directory: repository root (Leave empty!).
4. Build command: leave empty. 
5. Ensure `vercel.json` at repo root is detected!
6. Add environment variables:
   - `VBOOK_ALLOWED_ORIGIN=https://your-custom-domain.me` (or `*`)
   - `VBOOK_WEB_FETCH_TIMEOUT_MS=12000`
   - **`KV_REST_API_URL`**: [REQUIRED] Generated via Vercel Storage KV setup.
   - **`KV_REST_API_TOKEN`**: [REQUIRED] Generated via Vercel Storage KV setup.

7. Connect your custom domain in **Settings > Domains**.
8. Deploy.

## 3. Tiered Cache & Sync Flow

The **VBook Backend** ensures sub-50ms API delivery:
1. **Tier 1 (Mem Cache)**: In-memory cache for identical hits within the same lambda instance.
2. **Tier 2 (KV Cache)**: `Vercel KV` (Redis) persists the system state across deployments.
3. **Tier 3 (Cold Sync)**: Scrapes remote sources on KV misses.
4. **Background Health Task**: Non-blocking `waitUntil()` scans site health and updates KV silently.

## 4. Troubleshooting

### "remote-sources.json is missing"
Vercel's bundler (NFT) needs literal paths. The `vercel.json` includes `web/remote-sources.json` in `includeFiles`. Do not use dynamic path resolution (e.g. `path.join`) for this file in serverless functions.

### API Slowdowns
- Check if `KV_REST_API_TOKEN` is correctly configured.
- If KV is not working, the system falls back to Tier-3 Sync on every request, which is much slower.

### Health Badges Missing
- The UI fetches fresh health data 5 seconds after load from `/api/health`.
- Ensure Vercel KV is properly linked to the project in the **Storage** tab.
