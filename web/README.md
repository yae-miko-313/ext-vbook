# VBook Extension Catalog Viewer

Web viewer cho phân vùng cộng đồng: hiển thị extension hiện có, tác giả, contribute, và copy link theo 2 kiểu.

## Kiến trúc: Realtime-First + Snapshot Fallback

**Realtime Mode (DEFAULT)**
- Thực time fetches fresh extension data directly from remote GitHub/GitLab sources
- Được kích hoạt mặc định khi mở trang
- Đảm bảo data luôn up-to-date (không cần rebuild)
- Flow: `./remote-sources.json` → fetch từng source trực tiếp

**Snapshot Mode (FALLBACK)**
- Sử dụng static cached files: `plugin.json`, `catalog.json`, `site-health.json`
- Chỉ được dùng khi realtime fetch không thành công
- Auto-generated bởi `npm run sync:web-catalog`

## Chạy local

```bash
# Rebuild personal extension manifests
npm run build:catalog

# Sync community aggregate into web/plugin.json + web/catalog.json + web/remote-sources.json
npm run sync:web-catalog

# Start live endpoint server that serves dynamic /plugin.json, /catalog.json, /remote-sources.json
npm run serve:web-catalog

# Refresh from repo source first, then start the live endpoint server
npm run serve:web-catalog:sync

# Start web server
cd web
python -m http.server 8000
```

Mở browser: `http://localhost:8000/`

Mặc định là realtime mode - browser sẽ đọc `./remote-sources.json` và fetch trực tiếp từng source. Nếu chạy `npm run serve:web-catalog`, các endpoint này cũng được phục vụ động từ repo nguồn mới nhất.

**Force snapshot mode** (debug only):
```
http://localhost:8000/?catalog=1
```

## Cấu trúc dữ liệu

### web/plugin.json (Root Manifest - Snapshot)
Aggregate của toàn bộ extensions (fallback khi realtime fail).

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "data": [
    { "name": "...", "author": "...", "type": "novel", "path": "..." }
  ]
}
```

### web/catalog.json (Sidecar - Snapshot)
Chi tiết về từng source repo (By Source view).

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "summary": { "total": 35, "changed": 0, "unchanged": 35, "errors": 0, "mode": "sync" },
  "referenceListUrl": "...",
  "sources": [
    {
      "id": "alexsonxxx-main",
      "url": "https://raw.githubusercontent.com/alexsonxxx/vbook/...",
      "displayName": "alexsonxxx/vbook",
      "status": "active",
      "content": { "data": [ { "name": "...", ... } ] }
    }
  ]
}
```

### web/remote-sources.json (Realtime Config - CRITICAL)
Danh sách source repositories cho realtime fetching. **AUTO-SYNCED từ references/remote-sources.json**.

```json
{
  "generatedAt": "2026-04-13T05:36:41.876Z",
  "source": "references/remote-sources.json",
  "referenceListUrl": "https://...",
  "sources": [
    {
      "id": "darkrai9x-main",
      "url": "https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/.../plugin.json",
      "avatar": "..."
    }
  ]
}
```

### web/site-health.json (Monitoring Data)
Health status của từng source site (dead, cloudflare, redirected, etc).

## Lenh health check theo scope

```bash
# Legacy alias (chi check URL source trong web/plugin.json)
npm run sync:web-health

# Scope ro rang
npm run sync:health:web
npm run sync:health:realtime
npm run sync:health:all
```

Khuyen nghi deploy: chay `npm run sync:health:all` de gom ca URL site extension va URL repo realtime.

## Tính năng viewer

### Header: Statistics Dashboard
- Tổng ext, By Type (novel/comic/chinese/...)
- Tổng repo nguồn tham khảo
- Link copy aggregate catalog

### Community Focus
- Hiển thị ext cộng đồng theo view trực quan
- Hiển thị tác giả cho từng ext
- Hiển thị contribute/acknowledgement theo danh sách author

### View Mode: By Extension
- **Hiển thị**: Mỗi extension cộng đồng là 1 card
- **Source**: Realtime mode: fetched từng source; Snapshot: từ `web/plugin.json`
- **Action buttons**: 
  - "Site URL": Mở trang gốc
  - "Copy Link": Copy raw URL
- **Author credits**: Đếm unique authors từ toàn bộ extension

### View Mode: By Source
- **Hiển thị**: Mỗi source repo là 1 card
- **Source**: Realtime mode: fetched live; Snapshot: từ `web/catalog.json`
- **Info**: Header tối giản khi đóng; mở ra mới thấy đầy đủ metadata + extension list
- **Action**: "Copy Source" - copy raw plugin.json URL

## File purposes

| File | Purpose | Auto-generated? | Role |
|------|---------|---|---|
| `index.html` | UI structure | No | Static |
| `script.js` | Rendering & UI logic | No | Static |
| `data.js` | Data loader (realtime/snapshot) | No | **CRITICAL - handles mode switching** |
| `style.css` | Styling | No | Static |
| `theme.js` | Dark/light theme toggle | No | Static |
| `plugin.json` | Snapshot root manifest | **Yes** | Fallback only |
| `catalog.json` | Snapshot sidecar/sources | **Yes** | Fallback only |
| `remote-sources.json` | Realtime source list | **Yes** (from references/) | **CRITICAL - realtime mode** |
| `site-health.json` | Site health monitoring | **Yes** (external) | Optional |
| `.nojekyll` | GitHub Pages config | No | Static |
| `DEPLOY.md` | Deployment notes | No | Reference |
| `README.md` | This file | No | Reference |

### Search
- Tìm theo: tên ext, author, description, source URL
- Case-insensitive, hỗ trợ tiếng Việt (NFKC normalized)

### Author Acknowledgement  
- Hiển thị unique authors + count
- Top 3 authors (ranked by contribution count)
- Distribution chart (top 8) with percentages

## Cập nhật dữ liệu

Snapshot count thay đổi theo từng lần sync.

Để xem số mới nhất tại local:

```bash
node -e "const p=require('./web/plugin.json');const c=require('./web/catalog.json');console.log('sources=',(c.sources||[]).length,'extensions=',(p.data||[]).length);"
```

Các extension đặt trong `.private/extensions/**` không được đưa vào catalog public (`extensions/plugin.json`, `web/plugin.json`, `web/catalog.json`).

Mặc định web chạy ở chế độ **realtime**: browser sẽ đọc `web/remote-sources.json`, fetch trực tiếp các `raw plugin.json` từ repo nguồn và tự aggregate khi mở trang.

Nếu cần ép về snapshot tĩnh (đọc `web/plugin.json` + `web/catalog.json`), thêm query:

```
https://<your-pages-url>/?realtime=0
```

### Tự động (developer)
```bash
  npm run sync:web-catalog
  npm run sync:web-health
```
Tái sinh:
- `web/plugin.json` (link tổng)
- `web/catalog.json` (sidecar nguồn)
- `web/remote-sources.json` (manifest nguồn cho realtime mode)
- `web/site-health.json` (trạng thái URL site ext: die/cloudflare/redirect)

Nếu có domain đổi tên nhưng script chưa nhận đúng, thêm override tại `references/site-health-overrides.json`.

Format:
```json
{
  "byUrl": {
    "https://old.example.com/": {
      "state": "redirected",
      "finalUrl": "https://new.example.com/",
      "note": "Domain moved"
    }
  },
  "byHost": {
    "old-host.com": {
      "state": "redirected",
      "finalUrl": "https://new-host.com/"
    }
  }
}
```

Logic sync có khử trùng theo `path` (fallback: `name+author+source+type`) để tránh double-count khi `ref/plugin.json` có cả `data[]` và `sources[].content.data[]`.

### Realtime (user - optional)
Sử dụng query parameter để đọc catalog từ custom source:
```
http://localhost:8000/web/?catalog=<URL_TO_PLUGIN_JSON>
```

Ví dụ:
```
http://localhost:8000/web/?catalog=https://raw.githubusercontent.com/user/repo/main/plugin.json
```

**Lưu ý**: URL phải là raw JSON file dạng root-like (`metadata` + `data[]`) như `web/plugin.json`, và CORS phải allow.

## Workflow cập nhật

1. **Edit local extensions**:
   ```bash
   npm run ext:edit -- --plugin extensions/novel/my_ext
   ```

2. **Build extension to ZIP** (nếu sẵn sàng distribute):
   ```bash
   npm run build -- --plugin extensions/novel/my_ext
   ```

3. **Sync community web catalog**:
   ```bash
  npm run sync:web-catalog
   ```
   
4. **Reload web viewer**: F5 hoặc `http://localhost:8000/web/`

## File structure

```text
web/
├── index.html              # Main page + layout
├── script.js               # Event handlers + render logic
├── data.js                 # Catalog loader + data parser
├── plugin.json             # AUTO-GENERATED aggregate root catalog (By Extension)
├── catalog.json            # AUTO-GENERATED source sidecar (By Source)
├── style.css               # Styling
├── theme.js                # Theme toggle
└── README.md               # (This file)
```

## Development notes

- HTML, CSS, JS không dùng framework (vanilla)
- Catalog loader support split format:
  - `web/plugin.json`: top-level `metadata`, `data[]`
  - `web/catalog.json`: `metadata`, `summary`, `referenceListUrl`, `sources[]`
- XHR CORS: Web server phải serve CORS headers cho external catalog URLs
- Mobile-friendly: Authors list collapse trên mobile (first 7 items, toggle expand)
- Web không phải nơi build ext cá nhân; nó chỉ hiển thị và copy catalogue của cả cộng đồng

## Contributing

- Xem hướng dẫn chung: [../docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md)
- PR checklist bao gồm: `npm run build:catalog` để update catalog
- Contract backend API (Vercel): [../docs/DEPLOY_VERCEL_GITHUB.md](../docs/DEPLOY_VERCEL_GITHUB.md)

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|------------|---------|
| Web không load extension | `remote-sources.json` sai hoặc nguồn realtime lỗi/CORS | Chạy `npm run sync:web-catalog`, kiểm tra `web/remote-sources.json` và browser console |
| "Lỗi: sai cấu trúc aggregate" | Missing `data[]` trong `plugin.json` | Kiểm tra `plugin.json` structure |
| Realtime catalog không load | CORS issue hoặc URL sai | Verify URL, check browser console |
| Author count = 0 | Chưa có extension hoặc author field trống | Kiểm tra `extensions/*/plugin.json` có `author` field |

