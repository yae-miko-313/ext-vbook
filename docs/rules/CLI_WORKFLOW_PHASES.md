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

4. **(Optional) Generate `extensions/catalogs/*.plugin.json`**
   - Dùng cho web quick-link theo từng nhóm
   - Mục đích: giữ web copy-link và catalog theo type luôn đồng bộ
   - Output: `extensions/catalogs/novel.plugin.json`, `comic.plugin.json`, ...

### Optional Phases (khi cần)

**`verify --mode offline`** (recommended before push)
- Kiểm tra script syntax + metadata offline
- Không cần kết nối mạng, an toàn
- Nên chạy trước commit/push

**`test-all`** (nếu cần test thực trên app)
- Test flow Home → Chap (HTTP endpoints)
- Cần `.env` có VBOOK_IP + kết nối mạng
- Tùy chọn sau khi push

**`build`** (khi cần plugin.zip)
- Đóng gói src/ + icon.png thành plugin.zip
- Dùng khi cần sideload trực tiếp lên app
- Bắt buộc nếu catalog/grouped manifest đang trỏ `path` tới `plugin.zip`

## Cleanup Strategy

**Sau mỗi phase, dọn tmp artifacts:**
```bash
# Tự động check (không có Remove-Item):
$tmpDirs = Get-ChildItem -Path . -Recurse -Directory -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^(tmp|temp)$' }
```

- Phase batch-fix → cleanup
- Phase ai-fix-queue → cleanup
- Phase build-catalog → cleanup

## Catalog Zip Sync (khi grouped catalogs dùng zip path)

- Nếu `extensions/catalogs/*.plugin.json` trỏ `path` tới `plugin.zip`, phải build zip đồng bộ trước commit/push.
- Mỗi ext leaf trong `extensions/{type}/{name}` phải có `plugin.zip` tương ứng.

```bash
# Build zip cho 1 extension
npx vbook build --plugin extensions/[type]/[name]

# Build zip hàng loạt cho toàn bộ ext leaf
$plugins = Get-ChildItem -Path "extensions" -Filter "plugin.json" -Recurse |
   Where-Object { $_.FullName -match "extensions\\[^\\]+\\[^\\]+\\plugin.json$" } |
   ForEach-Object { Split-Path $_.FullName -Parent } | Sort-Object -Unique

foreach ($p in $plugins) {
   $rel = $p.Substring((Get-Location).Path.Length + 1)
   node tools/cli/index.js build --plugin "$rel"
}
```

## Output Artifacts

- `tools/cli/reports/fix-report.json` ← batch-fix output
- `tools/cli/reports/ai-fix-report.json` ← ai-fix-queue output
- `extensions/plugin.json` ← build-catalog mega catalog
- `extensions/catalogs/*.plugin.json` ← per-type quick-link catalogs (optional)
- `extensions/**/plugin.zip` ← bắt buộc khi grouped catalogs dùng zip path
- Root `plugin.json` (manifest cá nhân) không nằm trong output auto-generate

## Best Practices

✅ **DO:**
- Chạy batch-fix + ai-fix-queue sau mỗi lần migrate/sort
- Chạy build-catalog cuối cùng để sync catalog
- Build zip hàng loạt trước push nếu grouped catalogs đang dùng zip path
- Commit/push liền không cần build/test thủ công
- Test trên app sau push (nếu cần, dùng test-all)
- Dọn tmp sau từng phase
- Giữ root `plugin.json` theo schema cá nhân `{metadata, data}`

❌ **DON'T:**
- Bỏ qua build plugin.zip khi grouped catalogs đang trỏ zip path
- Test thủ công manual trên điện thoại nếu có thể test qua endpoint
- Skip build-catalog (catalog phải đồng bộ)
- Xoá icon.png tự động (báo lại để xử lý thủ công)
- Không sync hoặc ghi đè root `plugin.json` bằng schema catalog từ `extensions/plugin.json`

## Legal Gate (Bắt buộc trước khi làm ext mới)

- Nếu site có mã số thuế hoặc thông tin đăng ký/đã thông báo Bộ Công Thương, không làm extension cho site đó.
- Nếu site thể hiện quyền sở hữu bản quyền và đang vận hành thương mại rõ ràng, ưu tiên né để giảm rủi ro pháp lý.
- Nếu gặp case nghi ngờ: dừng implement, mở issue nội bộ và chờ xác nhận maintainer.

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

# Nếu grouped catalogs dùng zip path: build đồng bộ trước push
# (dùng script PowerShell ở mục "Catalog Zip Sync")
```
