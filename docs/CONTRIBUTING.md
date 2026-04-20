# Contributing

Tài liệu đóng góp chính cho repo.

## Phạm vi

- **Public extensions**: `extensions/**` - Chứa các extension công khai cho cộng đồng (phải chạy build:catalog).
- **Private extensions**: `.private/extensions/**` - Không public, không vào catalog, được ignore bởi git.
- **Code reference**: `.private/code-reference/**` - **CLI**: `tools/cli/**` - Công cụ chính (Version 3 focus).
- **Web viewer**: `web/**` - Giao diện hiển thị cộng đồng (Served directly by Vercel).
- **Docs**: `docs/**` - Documentation.

## Prerequisites

```bash
npm install
```

Tạo `.env` tại root (xem [../README.md](../README.md)):

```env
VBOOK_IP=192.168.1.100
LOCAL_PORT=3000
VBOOK_AUTHOR=tên_của_bạn
```

## Workflow: Extension contribution

### Step 1: Tạo extension mới
```bash
npm run ext:create -- --name MyExtension --source https://example.com
```

### Step 2: Viết extension code
Tham khảo [AI_CODE_EXT_VBOOK.md](AI_CODE_EXT_VBOOK.md) để hiểu contract.

### Step 3: Build extension ZIP
```bash
npm run build -- --plugin extensions/novel/my_ext
```
Tạo `extensions/novel/my_ext/plugin.zip` sẵn sàng phân phối.

### Step 4: Rebuild personal catalog
```bash
npm run build:catalog
```
Tái sinh catalog cộng đồng local cho personal extensions.

### Step 5: Verify locally with Unified Server
Mở web viewer để kiểm tra extension xuất hiện trong view:
```bash
npm run vercel-dev
```
Truy cập `http://localhost:3000/`

## Pull Request Checklist

- [ ] Extension scaffold tạo bằng CLI (`npm run ext:create`)
- [ ] Code tham khảo `docs/AI_CODE_EXT_VBOOK.md` contract
- [ ] Extension đã build zip (`npm run build`)
- [ ] **Personal catalog đã rebuild** (`npm run build:catalog`) ✓ CRITICAL
- [ ] Đã test hiển thị trên Unified Dev Server (`npm run vercel-dev`)
- [ ] Không commit runtime reports (`tools/cli/reports/`)
- [ ] README + docs cập nhật nếu có thay đổi workflow

## Constraints

- **Không thủ công tạo folder**: Dùng CLI `npm run ext:create`
- **Không edit trực tiếp plugin.json**: Dùng CLI `npm run ext:edit`
- **Không skip build-catalog**: Bắt buộc để cập nhật personal manifests
- **Không copy-paste code mù**: Verify live site trước
- **Ext private không được để trong `extensions/`**: đặt tại `.private/extensions/**` để tránh public

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Extension không xuất hiện trong web | API Backend không fetch được source | Kiểm tra `web/remote-sources.json`, chạy lại `vercel dev` |
| Author count = 0 | Missing `author` field | Edit `extensions/*/plugin.json` thêm author |

## Docs update policy

- Khi thay đổi:
- CLI commands → update `../README.md` + `docs/CONTRIBUTING.md`
- Deployment → update `docs/DEPLOY_VERCEL.md`
- Web structure → update `web/README.md`
- Extension template → update `docs/AI_CODE_EXT_VBOOK.md`

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

web/                        # Giao diện Frontend
├── index.html              
├── remote-sources.json      # Danh sách nguồn cho Backend
├── script.js                
└── style.css

api/                        # Vercel Backend API
└── ...

tools/cli/
├── index.js                 # Main entrypoint
└── ...
```

web/
├── plugin.json              # AUTO-GENERATED snapshot fallback aggregate
├── catalog.json             # AUTO-GENERATED snapshot fallback sidecar
└── remote-sources.json      # AUTO-GENERATED realtime source manifest

tools/cli/
├── index.js                 # Main entrypoint
└── build/
    ├── build.js             # buildExtensionZip()
    └── build-catalog.js     # buildCatalog()
```

## Notes

- Cá nhân extensions chỉ qua CLI - đảm bảo consistency + track changes
- Catalog rebuild/sync bắt buộc để web artifacts luôn nhất quán
- Author credits động từ data - không hardcode
- Sync script có dedupe theo path để tránh double-count community items

