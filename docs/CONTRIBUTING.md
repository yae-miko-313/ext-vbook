# Contributing

Tài liệu đóng góp chính cho repo.

## Phạm vi

- **Public extensions**: `extensions/**` - Chứa các extension công khai cho cộng đồng (phải chạy build:catalog).
- **Private extensions**: `.private/extensions/**` - Không public, không vào catalog, được ignore bởi git.
- **Gitea Private extensions**: `.tea-ext/**` - Chứa các extension upload lên Gitea (private).
- **CLI & Tools**: `tools/cli/**` - Công cụ quản lý chính.
- **Docs**: `docs/**` - Tài liệu hướng dẫn.

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
npm run build:ext -- --plugin extensions/novel/my_ext
```

Tạo `extensions/novel/my_ext/plugin.zip` sẵn sàng phân phối.

### Step 4: Rebuild personal catalog

```bash
npm run build:catalog
```

**BẮT BUỘC** cập nhật personal catalog mỗi khi thêm extension mới.

### Step 5: Verify locally
Bạn có thể dùng VSCode Tester hoặc các công cụ debug trong `tools/cli/` để kiểm tra extension.

Đối với việc hiển thị trên Web Viewer, vui lòng tham khảo [vbook-web-service/README.md](../vbook-web-service/README.md) để chạy local portal.

## Pull Request Checklist

- [ ] Extension scaffold tạo bằng CLI (`npm run ext:create`)
- [ ] Code tham khảo `docs/AI_CODE_EXT_VBOOK.md` contract
- [ ] Extension đã build zip (`npm run build:ext`) ✓ CRITICAL
- [ ] **Personal catalog đã rebuild** (`npm run build:catalog`) ✓ CRITICAL
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
| :--- | :--- | :--- |
| Lỗi build ZIP | Folder thiếu `plugin.json` hoặc `src/` | Kiểm tra lại cấu trúc folder extension |
| Lỗi catalog | Không tìm thấy extension sau khi thêm | Đảm bảo đã chạy `npm run build:catalog` |

## Docs update policy

- Khi thay đổi:
  - CLI commands → update `../README.md` + `docs/CONTRIBUTING.md`
  - Deployment → update `docs/DEPLOY_VERCEL.md`
  - Web structure → update `web/README.md`
  - Extension template → update `docs/AI_CODE_EXT_VBOOK.md`

## File structure recap

```text
extensions/                 # Chỉ edit qua CLI
├── novel/
│   ├── my_ext/
│   │   ├── src/             # Extension code
│   │   ├── icon.png
│   │   └── plugin.json      # Metadata
│   └── plugin.json          # Type catalog (auto-generated)
└── plugin.json              # Root catalog (auto-generated)

tools/cli/
├── index.js                 # Main entrypoint
└── ...
```

## Notes

- Cá nhân extensions chỉ qua CLI - đảm bảo consistency + track changes
- Catalog rebuild/sync bắt buộc để web artifacts luôn nhất quán
- Author credits động từ data - không hardcode
- Sync script có dedupe theo path để tránh double-count community items
