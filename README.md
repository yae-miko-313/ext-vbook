# VBook Tool

Repo này là công cụ 2 trong 1 cho VBook:

- **Phân vùng cộng đồng**: `ref/` + `web/` để gom raw content của cộng đồng, tổng hợp thành một link duy nhất, và hiển thị trực quan ext/tác giả/contribute.
- **Phân vùng cá nhân**: `extensions/` + `tools/cli/` để tạo, sửa, build extension phục vụ chủ sở hữu repo.

## Mục tiêu hệ thống

- **`ref/`**: Monitor raw content của cộng đồng, sync vào `ref/plugin.json`
- **`web/`**: Hiển thị extension cộng đồng, tác giả, đóng góp, copy nhanh theo 2 kiểu: copy link tổng và copy theo nguồn repo
- **`extensions/`**: Chứa extension cá nhân (private), build thành `.zip` để phân phối
- **`tools/cli/`**: Tạo/sửa/build extension cho cá nhân chủ sở hữu
- **`code-reference/`**: Kho source tham chiếu để học tập, không phải output cuối

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

### 4️⃣ Rebuild catalog manifests
```bash
npm run build:catalog
```
Quét `extensions/*/` → tái sinh:
- `extensions/{type}/plugin.json` (per-type manifest)
- `extensions/plugin.json` (root manifest - all extensions)

Đây là lệnh chính để rebuild catalog cá nhân.

### 5️⃣ Đồng bộ web viewer / community aggregate
```bash
npm run sync:web-catalog
```
Sinh 2 file cho web viewer từ `ref/plugin.json`:
- `web/plugin.json`: link tổng (root-like: `metadata` + `data`)
- `web/catalog.json`: sidecar source (`summary` + `referenceListUrl` + `sources[]`)

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
npm run sync:web-catalog        # Generate web/plugin.json + web/catalog.json from ref/plugin.json
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

tools/cli/
├── index.js                     # Main CLI entrypoint
├── scaffold/                    # Extension template generator
└── build/
    ├── build.js                 # buildExtensionZip() - ZIP extension
    └── build-catalog.js         # buildCatalog() - rebuild manifests

code-reference/                 # External repos (for learning)
├── novel/
├── comic/
└── ...

ref/
└── plugin.json                  # Community aggregate (raw sources -> sync target)

web/                            # Web viewer (reads aggregate)
├── index.html                   # Main page
├── plugin.json                  # AUTO-GENERATED: link tổng (root-like aggregate)
├── catalog.json                 # AUTO-GENERATED: source sidecar for By Source view
├── script.js                    # Load + render catalog
├── data.js                      # Catalog format parser
└── style.css

docs/                           # Documentation
├── AI_CODE_EXT_VBOOK.md         # Extension writing contract for AI agents
├── CONTRIBUTING.md              # PR checklist + contributing guide
├── REFERENCE_REPOS.md           # External source list + trust levels
└── vbook_demo.md                # Code snippet examples
```

## Web viewer: Aggregate design

`web/plugin.json` là link tổng mirror từ `ref/plugin.json` và dùng cho By Extension.
`web/catalog.json` là sidecar nguồn dùng cho By Source.

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

Web viewer đọc `web/plugin.json` làm aggregate chính (root-like), và đọc thêm `web/catalog.json` để lấy metadata/source list.

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
- [docs/REFERENCE_REPOS.md](docs/REFERENCE_REPOS.md): Danh sách repo tham khảo + trust level
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

