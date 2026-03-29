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
- [`docs/AI_CODE_EXT_VBOOK.md`](docs/AI_CODE_EXT_VBOOK.md): Dùng để nắm Rule viết code, Javascript API có sẵn, Rhino API.
- [`docs/REFERENCE_REPOS.md`](docs/REFERENCE_REPOS.md): Các kho mở cộng đồng tham khảo pattern xử lý web.
- [`docs/vbook_demo.md`](docs/vbook_demo.md): Tham khảo cách xử lý DOM, JS logic mẫu và config nâng cao.
