# Contributing

Tài liệu đóng góp chính cho repo.

## Phạm vi

- **Personal extensions**: `extensions/**` - tạo/sửa qua CLI
- **Code reference**: `code-reference/**` - repos tham khảo từ contributors (read-only)
- **CLI**: `tools/cli/**` - commands create/edit/build/build-catalog
- **Web viewer**: `web/**` - catalog viewer + community aggregate loader
- **Reference data**: `ref/plugin.json` - community aggregate (synced outside)
- **Docs**: `docs/**` - documentation

## Prerequisites

```bash
npm install
```

Tạo `.env` tại root (xem [../README.md](../README.md)):

```env
VBOOK_IP=192.168.1.100
LOCAL_PORT=8080
VBOOK_PORT=8080
VBOOK_AUTHOR=tên_của_bạn
```

## Workflow: Extension contribution

### Step 1: Tạo extension mới
```bash
npm run ext:create -- --name MyExtension --source https://example.com
```

### Step 2: Viết extension code
Tham khảo [AI_CODE_EXT_VBOOK.md](AI_CODE_EXT_VBOOK.md) để hiểu:
- Template structure (`src/`, `icon.png`)
- Available APIs (home, search, detail, toc, chapter)
- Metadata fields (author, version, locale)

### Step 3: (Optional) Update metadata
```bash
npm run ext:edit -- --plugin extensions/novel/my_ext --description "Mô tả mới"
```

### Step 4: Build extension ZIP
```bash
npm run build -- --plugin extensions/novel/my_ext
```
Tạo `extensions/novel/my_ext/plugin.zip` sẵn sàng phân phối.

### Step 5: Rebuild catalog (required for PR)
```bash
npm run build:catalog
npm run sync:web-catalog
```
Tái sinh personal catalog:
- `extensions/*/plugin.json` (per-type)
- `extensions/plugin.json` (root)

Sync community catalog:
- `web/plugin.json` (root-like aggregate link)
- `web/catalog.json` (source sidecar for By Source)

**⚠️ IMPORTANT**: Bước 5 BẮTBUỘC trước khi commit/PR khi đổi personal extensions hoặc community aggregate.

### Step 6: Verify web viewer
- Mở web viewer (nếu có local server)
- Kiểm tra extension xuất hiện trong view
- Kiểm tra author count trong credits section

## Pull Request Checklist

- [ ] Extension scaffold tạo bằng CLI (`npm run ext:create`)
- [ ] Code tham khảo `docs/AI_CODE_EXT_VBOOK.md` contract
- [ ] Extension đã build zip (`npm run build`)
- [ ] **Personal catalog đã rebuild** (`npm run build:catalog`) ✓ CRITICAL
- [ ] **Community catalog đã sync** (`npm run sync:web-catalog`) nếu `ref/` đổi
- [ ] Web viewer catalogs có update (`web/plugin.json` và/hoặc `web/catalog.json` modified)
- [ ] Không commit runtime reports (`tools/cli/reports/`)
- [ ] README + docs cập nhật nếu có thay đổi workflow

## Constraints

- **Không thủ công tạo folder**: Dùng CLI `npm run ext:create`
- **Không edit trực tiếp plugin.json**: Dùng CLI `npm run ext:edit`
- **Không skip build-catalog**: Bắt buộc để cập nhật personal manifests
- **Không skip sync:web-catalog**: Bắt buộc để cập nhật community web catalog khi `ref/` đổi
- **Không copy-paste code mù**: Verify live site trước - tham khảo `code-reference/` là ví dụ, không template

## Testing locally

```bash
# Full workflow test
npm run ext:create -- --name TestExt --source https://example.com
npm run ext:edit -- --plugin extensions/novel/test_ext --version 2
npm run build -- --plugin extensions/novel/test_ext --dry-run
npm run build:catalog

# Check web viewer updated
cat web/plugin.json | grep -i "test_ext"
```

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Extension không xuất hiện trong web | `web/plugin.json` chưa update | Chạy `npm run sync:web-catalog` |
| "Lỗi structure aggregate" | `data[]` missing trong `web/plugin.json` | Verify `ref/plugin.json` format |
| Build failed | `src/` không tồn tại | Kiểm tra extension scaffold complete |
| Author count = 0 | Missing `author` field | Edit `extensions/*/plugin.json` thêm author |

## Docs update policy

- Khi thay đổi:
- CLI commands → update `../README.md` + `docs/CONTRIBUTING.md`
- Web structure → update `web/README.md`
- Extension template → update `docs/AI_CODE_EXT_VBOOK.md`
- External sources → update `ref/plugin.json` + `docs/REFERENCE_REPOS.md`

## File structure recap

```
extensions/                 # Chỉ edit qua CLI
├── novel/
│   ├── my_ext/
│   │   ├── src/             # Extension code
│   │   ├── icon.png
│   │   └── plugin.json      # Metadata
│   └── plugin.json          # Type catalog (auto-generated)
└── plugin.json              # Root catalog (auto-generated)

web/
├── plugin.json              # AUTO-GENERATED root-like aggregate
└── catalog.json             # AUTO-GENERATED source sidecar

tools/cli/
├── index.js                 # Main entrypoint
└── build/
    ├── build.js             # buildExtensionZip()
    └── build-catalog.js     # buildCatalog()
```

## Notes

- Cá nhân extensions chỉ qua CLI - đảm bảo consistency + track changes
- Catalog rebuild/sync bắt buộc để web viewer thấy changes
- Author credits động từ data - không hardcode
- Sync script có dedupe theo path để tránh double-count community items

