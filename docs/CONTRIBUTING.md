# Contributing

Tài liệu đóng góp chính cho repo.

## Phạm vi

- Extension: `extensions/**`
- CLI: `tools/cli/**`
- Web viewer: `web/**`
- Docs: `docs/**`

## Điều kiện trước khi làm

1. `npm install`
2. Tạo `.env` theo hướng dẫn trong `README.md`

## Workflow đề xuất

1. `npm run full-sync`
2. `npm run check:duplicates`
3. Nếu sửa web: `npm run sync:web-catalog`

## Policy bắt buộc

- Không đổi attribution tác giả gốc.
- Dedupe theo cặp `source + author`.
- Cùng source nhưng khác author là hợp lệ.
- Vi phạm chỉ khi trùng `source + author`.

## Pull Request Checklist

- [ ] Full pipeline chạy xong.
- [ ] `policyViolationSources = 0`.
- [ ] Không gồm file report runtime.
- [ ] Docs đã cập nhật nếu thay đổi workflow.

## Runtime Reports

Report runtime được ghi vào:

- `tools/cli/reports/*.json`

Không commit các file này.
