# VBook Tool

Repo này là công cụ 2 trong 1 cho VBook:

- **Phân vùng cộng đồng**: `ref/` + `web/` để gom raw content của cộng đồng, tổng hợp thành một link duy nhất, và hiển thị trực quan ext/tác giả/contribute.
- **Phân vùng cá nhân**: `extensions/` + `tools/cli/` để tạo, sửa, build extension phục vụ chủ sở hữu repo.

## Mục tiêu hệ thống

- **`extensions/`**: Thư mục chứa các extensions **CÔNG KHAI** cho cộng đồng. Sau khi thêm/sửa, bắt buộc chạy `build:catalog`.
- **`.private/extensions/`**: Thư mục chứa các extensions **CÁ NHÂN** không công khai (đã ignore bởi git).
- **`tools/cli/`**: Bộ công cụ tạo, sửa, và build extension (Version 3 focus).
- **`web/`**: Giao diện hiển thị, lấy dữ liệu realtime từ Vercel API hoặc repo sources.
- **`.private/references/`**: Danh sách nguồn raw URL nguồn cộng đồng (`remote-sources.json`).
- **`.private/code-reference/`**: Kho source tham chiếu để học tập.

## Bắt đầu nhanh

```bash
npm install
```

Tạo file `.env` tại thư mục gốc:

```env
VBOOK_IP=192.168.1.100
LOCAL_PORT=8080
VBOOK_PORT=8080
VBOOK_AUTHOR=tên_của_bạn
```

## Workflow chính (5 bước)

### 1️⃣ Tạo extension mới
```bash
npm run ext:create -- --name MyExtension --source https://example.com
```
Scaffold thư mục + plugin.json template. Hint: Tham khảo `docs/AI_CODE_EXT_VBOOK.md` cho contract khi viết extension.

### 2️⃣ Sửa metadata extension
```bash
npm run ext:edit -- --plugin extensions/novel/my_ext --description "Mô tả mới"
```
Update `plugin.json` metadata (author, version, description, source, etc.)

### 3️⃣ Build extension thành ZIP
```bash
npm run build -- --plugin extensions/novel/my_ext
```
Tạo `extensions/novel/my_ext/plugin.zip` chứa `src/` + `icon.png`. Dùng để phân phối / cài vào VBook client.

Nếu không muốn public toàn bộ extension, lưu ext trong `.private/extensions/...` và không đưa vào `extensions/`.

### 4️⃣ Rebuild catalog manifests
```bash
npm run build:catalog
```
Quét `extensions/*/` → tái sinh:
- `extensions/{type}/plugin.json` (per-type manifest)
- `extensions/plugin.json` (root manifest - all extensions)

Đây là lệnh chính để rebuild catalog cộng đồng của bạn. **BẮT BUỘC** chạy sau khi thêm hoặc cập nhật bất kỳ extension nào trong thư mục `extensions/` để đồng bộ `extensions/plugin.json` (root catalog).

### 5️⃣ Đồng bộ web viewer / community aggregate
```bash
npm run sync:web-catalog
```
Sinh file snapshot/fallback cho web viewer:
- `web/plugin.json`: link tổng (root-like: `metadata` + `data`)
- `web/catalog.json`: sidecar source (`summary` + `referenceListUrl` + `sources[]`)
- `web/remote-sources.json`: danh sách nguồn cho realtime mode
- `web/site-health.json`: trạng thái URL (dead/cloudflare/redirected)

`sync:web-catalog` hiện đã chạy kèm health sync (`sync:health:all`).

### 🚀 Full sync (all-in-one)
```bash
npm run full-sync
```
Chạy `build:catalog` + `sync:web-catalog`.

## Lệnh CLI chi tiết

### Extension commands
| Lệnh | Mô tả |
|------|-------|
| `vbook ext --mode create --name NAME --source URL` | Scaffold extension mới |
| `vbook ext --mode edit --plugin PATH --description TEXT` | Update extension metadata |

### Build commands  
| Lệnh | Mô tả |
|------|-------|
| `vbook build --plugin PATH` | Package extension thành plugin.zip |
| `vbook build --plugin PATH --dry-run` | Preview (không tạo file) |
| `vbook build-catalog` | Rebuild all personal extension catalogs |

### NPM scripts (aliases)
```bash
npm run ext:create              # ext --mode create
npm run ext:edit                # ext --mode edit  
npm run build                   # build --plugin
npm run build:catalog           # build-catalog
npm run sync:web-catalog        # Generate web/plugin.json + web/catalog.json + web/remote-sources.json
npm run full-sync               # build:catalog + sync:web-catalog
```

## Cấu trúc repo

```text
extensions/                     # Personal extensions (build to .zip)
├── novel/
│   ├── kychi_ntruyen/           # Extension folder
│   │   ├── src/                 # JavaScript source files
│   │   ├── icon.png             # Extension icon
│   │   └── plugin.json          # Metadata
│   └── plugin.json              # Per-type manifest
├── comic/
├── plugin.json                  # Root manifest (all extensions)

.private/                        # Private extensions (gitignored)
└── extensions/
  └── novel/
    └── my_private_ext/
      ├── src/
      ├── icon.png
      ├── plugin.json
      └── plugin.zip

tools/cli/
├── index.js                     # Main CLI entrypoint
├── scaffold/                    # Extension template generator
└── build/
    ├── build.js                 # buildExtensionZip() - ZIP extension
    └── build-catalog.js         # buildCatalog() - rebuild manifests

.private/code-reference/        # External repos (for learning)
├── novel/
├── comic/
└── ...

.private/references/
└── remote-sources.json          # Danh sách nguồn raw cho realtime viewer

web/                            # Web viewer (Dynamic aggregate)
├── index.html                   # Giao diện chính
├── plugin.json                  # [FALLBACK] Aggregate snapshot
├── catalog.json                 # [FALLBACK] Sidecar snapshot
├── remote-sources.json          # [SYNCED] Realtime source list
├── script.js                    # Logic hiển thị
└── style.css
docs/                           # Documentation
├── AI_CODE_EXT_VBOOK.md         # Extension writing contract for AI agents
├── CONTRIBUTING.md              # PR checklist + contributing guide
└── DEPLOY_VERCEL_GITHUB.md      # Deploy + Vercel backend API
```

## Web viewer: Aggregate design

Mặc định web viewer chạy ở **realtime mode**, đọc `web/remote-sources.json` rồi fetch trực tiếp từng raw URL nguồn.

`web/plugin.json` và `web/catalog.json` vẫn được sinh như snapshot fallback và dùng khi realtime không khả dụng.

Cấu trúc:
Root `plugin.json` ở repo này là manifest cá nhân, chỉ có `metadata` và `data`.

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "data": [
    { "name": "...", "author": "...", "type": "novel", "...": "..." }
  ]
}
```

Web viewer ưu tiên realtime aggregate, và fallback sang `web/plugin.json` + `web/catalog.json` nếu cần.

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "data": [
    { "name": "...", "author": "...", "type": "novel", "...": "..." }
  ]
}
```

Sidecar `web/catalog.json`:

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "summary": { "total": 25, "changed": 0, "unchanged": 25, "errors": 0 },
  "referenceListUrl": "...",
  "sources": [
    { "id": "...", "url": "...", "content": { "data": [...] } }
  ]
}
```

Web viewer hỗ trợ 2 view mode:
- **By Extension**: đọc `web/plugin.json` (`data[]`)
- **By Source**: đọc `web/catalog.json` (`sources[]`)

Web cũng hiển thị:
- số lượng ext
- tác giả
- phần contribute/acknowledgement

## Tài liệu

- [docs/AI_CODE_EXT_VBOOK.md](docs/AI_CODE_EXT_VBOOK.md): Contract khi viết extension (variables, APIs)
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md): PR checklist, build/test steps
- [docs/DEPLOY_VERCEL_GITHUB.md](docs/DEPLOY_VERCEL_GITHUB.md): Deploy guide + contract backend API Vercel
- [docs/vbook_demo.md](docs/vbook_demo.md): Snippet mẫu cho page types

## Workflow phát triển (dev loop)

```bash
# 1. Tạo extension mới
npm run ext:create -- --name MyNovel --source https://example.com

# 2. Edit plugin.json metadata + viết src/*.js
# (Tham khảo docs/AI_CODE_EXT_VBOOK.md)

# 3. Build thành ZIP
npm run build -- --plugin extensions/novel/my_novel

# 4. Rebuild catalog cá nhân
npm run build:catalog

# 5. Sync web viewer / cộng đồng
npm run sync:web-catalog

# 6. Kiểm tra web viewer: http://localhost:8080/web/
# (Should see community aggregate + copy links)
```

## Ghi chú

- Repo này là 2-in-1: công cụ sửa chữa/build ext cá nhân + bộ tổng quan community ext
- Các file/folder sinh ra khác chỉ để phục vụ một trong 2 phân vùng trên
- Extension CHỈ được tạo/sửa qua CLI, không tạo thủ công
- Khi viết extension, tham khảo `docs/AI_CODE_EXT_VBOOK.md` cho APIs có sẵn
- Web author acknowledgement tính động từ catalog data

