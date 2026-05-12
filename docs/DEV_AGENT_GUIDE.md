# vBook Extension Development Guide

## Tổng quan (Dành cho Dev & Agent)
Dự án này là một công cụ quản lý và phát triển các tiện ích bổ sung (extensions) cho ứng dụng vBook. Hệ thống sử dụng JavaScript (Rhino engine) để xử lý dữ liệu từ các trang web truyện, comic, video.

### 1. Cấu trúc thư mục
- `extensions/`: Chứa các extension công khai. Được phân loại theo `novel`, `comic`, `video`, v.v.
- `.tea-ext/`: (Mới) Chứa các extension private được upload lên Gitea.
- `tools/cli/`: Bộ công cụ dòng lệnh để tạo, sửa và build extension.
- `docs/`: Tài liệu chi tiết về API và contract.

### 2. Quy trình phát triển (Workflow)
1.  **Tạo mới**: Sử dụng `npm run ext:create`.
2.  **Phát triển**: Viết code trong thư mục `src/` của extension. Tuân thủ contract trong `docs/AI_CODE_EXT_VBOOK.md`.
3.  **Build**: Chạy `npm run build:ext -- --plugin path/to/ext` để tạo file `plugin.zip`.
4.  **Đồng bộ**: Luôn chạy `npm run build:catalog` sau khi thêm/xóa hoặc thay đổi metadata để cập nhật file `plugin.json` tổng.

### 3. Nguyên tắc cho AI Agent
Khi làm việc với dự án này, Agent cần lưu ý:
- **Đọc API trước**: Luôn kiểm tra các file proxy JSON trong `extensions/chinese_novel/api-proxy` để hiểu cấu trúc dữ liệu trả về trước khi sửa code xử lý.
- **Tương thích Rhino**: Tránh sử dụng các tính năng Modern JS (ES6+) không được Rhino hỗ trợ (ví dụ: `const/let` cần kiểm tra môi trường, ưu tiên `var` cho script extension).
- **Metadata**: Không sửa trực tiếp `plugin.json` ở root. Hãy sửa `plugin.json` trong từng extension rồi chạy `build-catalog`.

### 4. Lệnh CLI quan trọng
- `npm run build:catalog`: Cập nhật danh mục tổng hợp.
- `npm run build:ext`: Đóng gói extension thành ZIP.

---
*Lưu ý: Luôn giữ thông tin author là "kychi" trừ khi có yêu cầu khác.*
