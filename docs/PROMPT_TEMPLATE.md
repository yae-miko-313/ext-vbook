# 🤖 Bản mẫu Hướng dẫn Agent viết Extension (Prompt Template)

Tài liệu này là bản mẫu (template) chuẩn hóa bằng Tiếng Việt để gửi trực tiếp cho các AI Agent khác khi giao nhiệm vụ phát triển hoặc chỉnh sửa một Extension VBook mới.

---

## 📋 BẢN GIAO NHIỆM VỤ CHI TIẾT (AGENT PROMPT)

> [!NOTE]
> _Sao chép toàn bộ nội dung từ phần này trở xuống để làm prompt đầu vào cho Agent._

---

### 1. Các nguyên tắc tối cao bắt buộc tuân thủ:

- **Không tự ý thực hiện các hành động sau** (Trừ khi được yêu cầu rõ ràng):
  - Không tự động đóng gói ZIP (`build:ext`).
  - Không tự động cài đặt payload lên thiết bị (`install`).
  - Không tự động commit hoặc push code lên GitHub.
- **Không chỉnh sửa trực tiếp** các tệp tin danh mục tổng hợp được tạo tự động: `extensions/plugin.json` hoặc `extensions/{loại}/plugin.json`.
- **Luôn đọc kỹ tài liệu trước khi lập trình**:
  - Hướng dẫn lập trình tổng quan: [docs/EXTENSION_DEVELOPMENT_GUIDE.md](file:///d:/My%20Code/vbook-tool/docs/EXTENSION_DEVELOPMENT_GUIDE.md)
  - Hướng dẫn tra cứu hàm: [docs/JSBRIDGE_REFERENCE.md](file:///d:/My%20Code/vbook-tool/docs/JSBRIDGE_REFERENCE.md)
- **Đảm bảo thu thập đầy đủ dữ liệu**: Khảo sát DOM của trang web nguồn, hiểu rõ cấu trúc dữ liệu mong muốn trước khi viết bất kỳ hàm phân tích nào.
- **Không sử dụng cú pháp ES6+**: Chỉ sử dụng cú pháp tương thích môi trường Rhino (ES5), bắt buộc dùng `var` thay thế hoàn toàn cho `let` và `const`, không dùng hàm mũi tên hoặc async/await.

---

### 2. Yêu cầu triển khai cụ thể:

- **Tên Extension**: `[Nhập tên hiển thị tại đây]`
- **Trang web nguồn (Source URL)**: `[Nhập URL trang nguồn tại đây]`
- **Thể loại Extension (Type)**: `[novel | comic | video | translate | tts]`
- **Các lưu ý đặc thù**:
  - `[Ghi chú thêm về cấu trúc trang, quảng cáo cần chặn, hoặc cơ chế mã hóa cần vượt qua nếu có]`

---

### 3. Tài liệu & Code tham khảo:

- Tham khảo cấu trúc của các extension cùng thể loại đã chạy ổn định trong thư mục: `extensions/[Thể_loại]/`
- Tham khảo tài liệu thiết kế giải mã nội dung nâng cao (nếu trang web áp dụng mã hóa chống cào dữ liệu): [docs/DECRYPTION_PATTERNS.md](file:///d:/My%20Code/vbook-tool/docs/DECRYPTION_PATTERNS.md)
