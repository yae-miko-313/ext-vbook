# VBook Tool

CLI và bộ quy trình catalog cho hệ thống extension VBook.

## Mục tiêu

- Đồng bộ extension từ nhiều nguồn.
- Chuẩn hóa metadata và cấu trúc extension.
- Build catalog để web viewer và app sử dụng.
- Bảo vệ policy dedupe theo `source + author`.

## Bắt đầu nhanh

```bash
npm install
```

Tạo file `.env` tại thư mục gốc:

```env
VBOOK_IP=192.168.1.100
LOCAL_PORT=8080
VBOOK_PORT=8080
VBOOK_AUTHOR=kychi
```

## Workflow chính

1. Đồng bộ full pipeline:
   - `npm run full-sync`
2. Kiểm tra duplicate policy:
   - `npm run check:duplicates`
3. Nếu sửa web:
   - `npm run sync:web-catalog`

## Lệnh quan trọng

- `npm run sync:sources`: Lấy metadata raw từ remote sources.
- `npm run inventory`: Tạo inventory report.
- `npm run sort`: Sắp xếp extension theo type vào `extensions/{type}/{name}`.
- `npm run batch-fix`: Chạy lint/fix hàng loạt.
- `npm run prune-policy-duplicates`: Loại bỏ extension vi phạm policy trùng source + author.
- `npm run build-catalog`: Build `extensions/plugin.json` và `extensions/catalogs/*.plugin.json`.
- `npm run check:duplicates`: Kiểm tra duplicate policy và ghi report.

## Report Path

Tất cả report runtime được ghi vào:

- `tools/cli/reports/*.json`

Không commit report json vào git.

## Cấu trúc repo

```text
extensions/                 # Extension đã được phân loại
   catalogs/                 # Catalog theo nhóm type
tools/cli/                  # Lệnh CLI
  build/
  fix/
  lint/
  scaffold/
web/                        # Web viewer catalog
references/                 # Remote source references
```

## Tài liệu

- `docs/AI_CODE_EXT_VBOOK.md`: Contract cho agent khi viết extension.
- `docs/CONTRIBUTING.md`: Quy trình đóng góp và checklist PR.
- `docs/REFERENCE_REPOS.md`: Danh sách repo tham khảo + trust priority.
- `docs/vbook_demo.md`: Snippet mẫu cho home/detail/toc/chap.

## Lưu ý

- Không rewrite tác giả gốc trong metadata.
- Cùng source nhưng khác author được phép cùng tồn tại.
- Vi phạm chỉ khi trùng `source + author`.
