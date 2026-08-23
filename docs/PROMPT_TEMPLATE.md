# 🤖 Bản mẫu Hướng dẫn Agent viết Extension (Prompt Template)

Tài liệu này là bản mẫu (template) chuẩn hóa bằng Tiếng Việt để gửi trực tiếp cho các AI Agent khác khi giao nhiệm vụ tạo mới, sửa lỗi, test hoặc refactor một Extension VBook.

---

## 📋 BẢN GIAO NHIỆM VỤ CHI TIẾT (AGENT PROMPT)

> [!NOTE]
> *Sao chép toàn bộ nội dung từ phần này trở xuống để làm prompt đầu vào cho Agent.*

---

### 1. Các nguyên tắc tối cao bắt buộc tuân thủ:
* **Luôn đọc kỹ tài liệu trước khi lập trình**:
  - Hợp đồng API chính thức (Master Spec): [docs/extension-api.md](./extension-api.md)
  - Checklist kiểm tra dữ liệu: [docs/verify-checklist.md](./verify-checklist.md)
  - Master Skill Specification: [.claude/skills/vbook-extensions/SKILL.md](../.claude/skills/vbook-extensions/SKILL.md)
* **Quy tắc Môi trường Rhino (ES6 Safe Subset)**:
  - CẤM VI PHẠM: Cấm khai báo biến trùng tên với key trong `plugin.json.config` (`let DOMAIN = ...` / `const DOMAIN = ...`), vì App tự động tiêm key dưới dạng `const KEY = "..."` trước khi script thực thi. Dùng `load('config.js')` và `BASE_URL`.
  - LUÔN kiểm tra `if (!response.ok)` trước khi gọi `.html()`, `.json()`, `.text()`.
  - TRÁNH: KHÔNG dùng `async/await`, `Promise`, optional chaining `?.`, nullish coalescing `??`, object/array spread (`{...obj}`), `Array.prototype.flat`, numeric separators.
* **Quy trình Khởi tạo & Kiểm thử**:
  - Dùng lệnh CLI để tạo khung: `npm run ext:create -- --name <Tên> --source <URL> --type <novel|comic|video|audio|tts|translate>`. Không tự tạo folder bằng tay.
  - Chạy test trực tiếp qua REST-API: `npm run vbook:test -- <ext-folder> <script.js> [args...]`.
  - Đóng gói & đồng bộ catalog: `npm run vbook:build -- <ext-folder>` và `npm run build:catalog`.
* **Quy định bảo vệ dữ liệu**:
  - Không tự ý commit/push code lên Git khi chưa được xác nhận.
  - Không sửa các file `plugin.json` tổng hợp ở gốc bằng tay.

---

### 2. Yêu cầu triển khai cụ thể:

* **Tên Extension**: `[Nhập tên hiển thị tại đây]`
* **Trang web nguồn (Source URL)**: `[Nhập URL trang nguồn tại đây]`
* **Thể loại Extension (Type)**: `[novel | comic | video | audio | tts | translate]`
* **Các lưu ý đặc thù**:
  - `[Ghi chú thêm về cấu trúc trang, selector DOM, hoặc cơ chế mã hóa nếu có]`

---

### 3. Tài liệu & Code tham khảo:
* Bộ mẫu starter code chuẩn admin: `templates/[novel|comic|video|tts|translate]/`
* Các extension đang hoạt động cùng thể loại trong: `extensions/[loại]/`
* Hướng dẫn giải mã chống cào dữ liệu: [docs/DECRYPTION_PATTERNS.md](./DECRYPTION_PATTERNS.md)
