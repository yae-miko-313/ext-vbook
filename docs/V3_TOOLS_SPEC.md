# Version 3 Tools Specification

Dự án VBook Tool Version 3 tập trung vào việc hiện đại hóa bộ công cụ (CLI) để phục vụ tốt hơn cho việc phát triển extension và tích hợp AI.

## 1. Triết lý thiết kế (Architecture)

- **ModularFirst**: Mọi command trong CLI đều được tách thành các module riêng biệt trong `tools/cli/commands/`.
- **AgentReady**: Hỗ trợ MCP (Model Context Protocol) để các AI Agent có thể trực tiếp gọi công cụ.
- **StrictValidation**: Kiểm tra tính tương thích Rhino (ES5+) nghiêm ngặt trước khi đóng gói.

## 2. Các thành phần mới trong V3

### 2.1. MCP Server (`vbook-mcp-server.js`)
Cho phép AI Agent:
- Tự động rebuild catalog sau khi edit code.
- Chạy build/test extension mà không cần user can thiệp thủ công.

### 2.2. Command: Analyze (`vbook analyze`)
- **Mục tiêu**: Hỗ trợ tìm kiếm CSS Selectors và cấu trúc DOM nhanh chóng.
- **Input**: URL trang web.
- **Output**: Gợi ý selectors cho `title`, `author`, `chapter list`, v.v.

### 2.3. Command: Validate (`vbook validate`)
- Kiểm tra code trong `src/` có chứa cú pháp không được Rhino hỗ trợ (`async/await`, `?.`, `class`, v.v.).
- Đảm bảo extension chạy ổn định trên runtime của app.

### 2.4. Command: Publish (`vbook publish`)
- Tự động đẩy file `.zip` lên GitHub Release hoặc host CDN.
- Tự động cập nhật metadata version trong `plugin.json` cộng đồng.

## 3. Lộ trình phát triển (Roadmap)

- [x] Giai đoạn 1: Module hóa CLI (Done).
- [ ] Giai đoạn 2: Hoàn thiện MCP Server & Agent integration.
- [ ] Giai đoạn 3: Triển khai Analyze & Validate engine.
- [ ] Giai đoạn 4: Automation publishing pipeline.

## 4. Ghi chú cho Contributor

- Khi thêm command mới: Tạo file trong `tools/cli/commands/` và đăng ký trong `tools/cli/index.js`.
- Luôn giữ tính tương thích ngược với workflow Version 2 (sync catalog).
