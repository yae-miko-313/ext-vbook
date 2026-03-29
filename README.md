# VBook Extension Tool

CLI tool hỗ trợ phát triển, kiểm thử và đóng gói extension cho hệ thống VBook.

## Quick Start

Setup file `.env` tại thư mục gốc của workspace:
```env
VBOOK_IP=192.168.1.100
LOCAL_PORT=8080
VBOOK_PORT=8080
VBOOK_AUTHOR=your_name
```

```bash
npm install
```

**Workflow chuẩn 5 bước thiết kế Extension:**
1. **Scaffold**: `npx vbook scaffold` - Khởi tạo bộ khung.
2. **Lint**: `npx vbook lint --plugin extensions/[tên]` - Xác thực validate mã và metadata ban đầu.
3. **Fix**: `npx vbook fix --plugin extensions/[tên] --write` - Tự động chữa lỗi sai format/Noise.
4. **Verify Offline**: `npx vbook verify --mode offline --plugin extensions/[tên]` - Kiểm tra scripts an toàn.
5. **Build**: `npx vbook build --plugin extensions/[tên]` - Xuất `plugin.zip` để test.

## CLI Commands

| Command | Mô tả ngắn | Status |
|---|---|---|
| `lint` | Kiểm tra tính hợp lệ file `plugin.json` và cấu trúc mã nguồn. | 🟢 Done |
| `health` | Report tổng quan về lỗi nhiều extension (top-rules list). | 🟢 Done |
| `scaffold`| Generates mã lệnh ext mới thông qua menu tương tác. | 🟢 Done |
| `fix` | Autofix file rác, metadata typo, rule case issues. | 🟢 Done |
| `verify` | Offline check các script function và Online test kết nối ping. | 🟢 Done |
| `build` | Đóng gói thư mục src/ icon.png thành `plugin.zip` . | 🟢 Done |
| `install` | Sideload trực tiếp extension test lên Mobile IP port VBook. | 🟢 Done |
| `test-all`| 1-click test flow liên kết endpoint từ JS lên App (Home->Chap). | 🟢 (Local) |
| `debug` | Sandbox mode run bất kỳ hàm `js` độc lập trên terminal . | 🟢 (Local) |
| `inventory` | Quét toàn bộ ext + refs, dedupe theo domain và xuất báo cáo inventory. | 🟢 Done |
| `sort` | Copy ext keepFlag vào nhóm type `extensions/{type}/{name}` (skip nếu đích tồn tại). | 🟢 Done |
| `batch-fix` | Chạy lint -> fix(write+cleanup) -> lint lại trên toàn bộ ext đã sort. | 🟢 Done |
| `build-catalog` | Build catalog từng type và mega catalog `extensions/plugin.json`. | 🟢 Done |
| `ai-fix-queue` | Chạy vòng AI heuristic fix cho nhóm `needs_ai` với tối đa 2 attempts. | 🟢 Done |

## Mass Migration Workflow

Pipeline khuyến nghị cho hợp nhất hàng loạt extension:

```bash
npx vbook inventory
npx vbook sort --overwrite-existing --cleanup-root
npx vbook batch-fix
npx vbook ai-fix-queue
npx vbook build-catalog
```

**Chi tiết đầy đủ:** Xem [`docs/rules/CLI_WORKFLOW_PHASES.md`](docs/rules/CLI_WORKFLOW_PHASES.md#workflow--best-practices)

Artifacts mặc định:
- `tools/cli/reports/inventory.json`
- `tools/cli/reports/sort-report.json`
- `tools/cli/reports/fix-report.json`
- `tools/cli/reports/ai-fix-report.json`

Quy ước quan trọng:
- Dedupe key ưu tiên domain từ `metadata.source`.
- Rule thắng trùng lặp: version cao hơn -> trust repo cao hơn (`extensions` > `darkrai9x` > `dat-bi` > `others`).
- `sort` giữ nguyên `metadata.author` và giữ tên folder ext gốc.
- Nếu thư mục đích đã tồn tại, `sort` sẽ skip để tránh ghi đè.
- Có thể dùng `--overwrite-existing --cleanup-root` để đồng bộ lại và dọn các ext top-level đã migrate khỏi `extensions/`.
- `build-catalog` luôn tạo đủ 6 nhóm: `novel`, `comic`, `chinese_novel`, `translate`, `tts`, `_unknown`.

## File Structure

Cấu trúc chuẩn của một VBook Extension:
```
extensions/my-website/
├── plugin.json        # Config thông số script
├── icon.png           # 64x64px
├── src/               # Nơi chứa toàn bộ execute JS scripts
│   ├── detail.js
│   ├── toc.js
│   └── chap.js
```

## Docs
- [`docs/rules/CLI_WORKFLOW_PHASES.md`](docs/rules/CLI_WORKFLOW_PHASES.md): Quy trình hợp lệ batch processing extension, cleanup rules, best practices.
- [`docs/AI_CODE_EXT_VBOOK.md`](docs/AI_CODE_EXT_VBOOK.md): Dùng để nắm Rule viết code, Javascript API có sẵn, Rhino API.
- [`docs/REFERENCE_REPOS.md`](docs/REFERENCE_REPOS.md): Các kho mở cộng đồng tham khảo pattern xử lý web.
- [`docs/vbook_demo.md`](docs/vbook_demo.md): Tham khảo cách xử lý DOM, JS logic mẫu và config nâng cao.

## Distribution & Catalogs

**Root `plugin.json`:**
- Metadata & personal extensions (3 by kychi)
- Reference: `extensions/plugin.json` cho full community catalog (373 entries)
- Dùng để distribute bản cá nhân + link đến full catalog

**`extensions/plugin.json` (Auto-generated):**
- Mega catalog với 373 community extensions
- Được generate bởi `npx vbook build-catalog`
- Tôn trọng tác quyền - giữ nguyên author info từ original sources

**`extensions/catalogs/*.plugin.json` (Auto-generated):**
- Catalog theo từng nhóm để copy raw link nhanh từ web viewer
- Bao gồm: `novel`, `comic`, `chinese_novel`, `translate`, `tts`, `_unknown`
- Có thể regenerate bằng script đồng bộ sau khi build catalog

**CLI Tools:**
- Chỉ làm việc với `extensions/{type}/plugin.json` files
- Không modify root `plugin.json` (personal distribution file)
