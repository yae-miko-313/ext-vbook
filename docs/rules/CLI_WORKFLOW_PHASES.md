# VBook CLI Workflow Phases

## Recommended Development Pipeline

Quy trình phát triển extension tiêu chuẩn sau khi sort + migrate:

### Phase Execution Order

1. **`batch-fix`**
   - Chạy lint + autofix + cleanup trên toàn bộ extensions đã sort
   - Mục đích: Dọn format, fix typo, normalize metadata
   - Report: `tools/cli/reports/fix-report.json`

2. **`ai-fix-queue`**
   - Xử lý các plugins cần AI heuristics (needs_ai từ batch-fix report)
   - Mục đích: Fix automation-only errors (icon, critical metadata)
   - Report: `tools/cli/reports/ai-fix-report.json`
   - Max attempts: 2 (default)

3. **`build-catalog`**
   - Rebuild mega catalog từ từng type directory
   - Mục đích: Đồng bộ `extensions/plugin.json` với từng type catalog
   - Output: `extensions/plugin.json`, `extensions/{type}/plugin.json`

### Optional Phases (khi cần)

**`verify --mode offline`** (recommended before push)
- Kiểm tra script syntax + metadata offline
- Không cần kết nối mạng, an toàn
- Nên chạy trước commit/push

**`test-all`** (nếu cần test thực trên app)
- Test flow Home → Chap (HTTP endpoints)
- Cần `.env` có VBOOK_IP + kết nối mạng
- Tùy chọn sau khi push

**`build`** (chỉ khi cần plugin.zip)
- Đóng gói src/ + icon.png thành plugin.zip
- Dùng khi cần sideload trực tiếp lên app
- Không cần build nếu test qua endpoint

## Cleanup Strategy

**Sau mỗi phase, dọn tmp artifacts:**
```bash
# Tự động check (không có Remove-Item):
$tmpDirs = Get-ChildItem -Path . -Recurse -Directory -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^(tmp|temp)$' }
```

- Phase batch-fix → cleanup
- Phase ai-fix-queue → cleanup
- Phase build-catalog → cleanup

## Output Artifacts

- `tools/cli/reports/fix-report.json` ← batch-fix output
- `tools/cli/reports/ai-fix-report.json` ← ai-fix-queue output
- `extensions/plugin.json` ← build-catalog mega catalog
- Không tạo plugin.zip trừ khi thực sự cần

## Best Practices

✅ **DO:**
- Chạy batch-fix + ai-fix-queue sau mỗi lần migrate/sort
- Chạy build-catalog cuối cùng để sync catalog
- Commit/push liền không cần build/test thủ công
- Test trên app sau push (nếu cần, dùng test-all)
- Dọn tmp sau từng phase

❌ **DON'T:**
- Build plugin.zip nếu không có nhu cầu sideload
- Test thủ công manual trên điện thoại nếu có thể test qua endpoint
- Skip build-catalog (catalog phải đồng bộ)
- Xoá icon.png tự động (báo lại để xử lý thủ công)

## Quick Commands

```bash
# Dạy thông thường (sau sort):
npx vbook batch-fix
npx vbook ai-fix-queue
npx vbook build-catalog

# Verify trước push (optional):
npx vbook verify --mode offline --plugin extensions/[name]

# Test trên app (optional, sau push):
npx vbook test-all --plugin extensions/[name]

# Build chỉ khi cần (hiếm):
npx vbook build --plugin extensions/[name]
```
