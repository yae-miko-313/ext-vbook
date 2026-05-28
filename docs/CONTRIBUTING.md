# 🤝 Hướng dẫn Đóng góp (Contributing Guidelines)

Chào mừng bạn đến với Kho lưu trữ công cụ phát triển extension của VBook. Tài liệu này hướng dẫn các nhà phát triển cách cấu hình môi trường, quy trình đóng góp mã nguồn (Pull Request) và quy chuẩn làm việc thống nhất.

---

## 📂 1. Phạm vi phân vùng thư mục

Dự án này là công cụ kết hợp 2-trong-1: quản lý phát triển extension cho nhà quản trị và cung cấp chỉ mục tham khảo cho cộng đồng.

* **Công khai (Public extensions)**: Nằm trong thư mục `extensions/**` - Chứa các extension công khai cho cộng đồng (Bắt buộc chạy `build:catalog` để hiển thị).
* **Cá nhân (Private extensions)**: Nằm trong thư mục `.private/extensions/**` - Không công khai, bị bỏ qua bởi git, an toàn để thử nghiệm hoặc dùng cá nhân.
* **Đóng gói Gitea (Gitea Private extensions)**: Nằm trong thư mục `.tea-ext/**`. Được sử dụng để chứa các extension private được đóng gói để tải lên hệ thống server Gitea riêng của bạn.
  - `.tea-ext/plugin.json`: Quản lý danh mục các extension trong thư mục này.
  - `.tea-ext/extensions/`: Chứa mã nguồn của từng extension private tương ứng.
* **Bộ công cụ (CLI Tools)**: Nằm trong thư mục `tools/cli/**` - Chứa mã nguồn của CLI.
* **Tài liệu (Docs)**: Nằm trong thư mục `docs/**` và `.agent/`.

---

## 🛠️ 2. Cài đặt môi trường phát triển (Prerequisites)

### Cài đặt dependencies
```bash
npm install
```

### Thiết lập tệp cấu hình môi trường (`.env`)
Tạo tệp tin `.env` tại thư mục gốc của dự án với nội dung mẫu sau:
```env
VBOOK_IP=192.168.1.100       # Địa chỉ IP của thiết bị chạy app vBook để debug
LOCAL_PORT=3000              # Port chạy local server để test
VBOOK_AUTHOR=tên_của_bạn     # Tên tác giả hiển thị mặc định trên extension của bạn
```

---

## 🔄 3. Quy trình Đóng góp Extension tiêu chuẩn

Để đóng góp một extension mới hoặc cập nhật một extension có sẵn, bạn bắt buộc phải tuân theo 5 bước sau:

### Bước 1: Tạo mới Extension thông qua CLI
```bash
npm run ext:create -- --name MyExtension --source https://example.com
```
* > [!WARNING]
  > **Không tạo thư mục bằng tay**. Sử dụng CLI để sinh khung dữ liệu chuẩn xác nhất.

### Bước 2: Lập trình Mã nguồn
* Tham khảo hướng dẫn [docs/EXTENSION_DEVELOPMENT_GUIDE.md](file:///d:/My%20Code/vbook-tool/docs/EXTENSION_DEVELOPMENT_GUIDE.md) để viết mã nguồn đúng chuẩn Rhino (ES5).

### Bước 3: Đóng gói tệp ZIP
```bash
npm run build:ext -- --plugin extensions/novel/my_ext
```
* Tạo ra tệp `plugin.zip` sẵn sàng cài đặt.

### Bước 4: Tái tạo danh mục tổng (Bắt buộc)
```bash
npm run build:catalog
```
* Cập nhật danh sách catalog tổng hợp tại `extensions/plugin.json` để App/Viewer nhận diện được extension mới của bạn.

### Bước 5: Kiểm tra xác thực (Verify)
* Kiểm thử bằng VSCode Tester hoặc chạy local server để cài đặt trực tiếp lên app vBook qua địa chỉ IP đã cấu hình trong `.env`.

---

## 📋 4. Pull Request Checklist (Dành cho Dev & Agent)

Trước khi thực hiện commit mã nguồn hoặc tạo Pull Request, vui lòng kiểm tra kỹ danh sách sau:

- [ ] **Lệnh CLI**: Thư mục extension và metadata được tạo/chỉnh sửa thông qua CLI.
- [ ] **Không chỉnh sửa catalog bằng tay**: Không chỉnh sửa trực tiếp các file `plugin.json` tổng hợp ở gốc.
- [ ] **Quy tắc Rhino**: Không chứa bất kỳ cú pháp ES6+ nào (không dùng `let`, `const`, `arrow function`, `async/await`).
- [ ] **Đóng gói ZIP**: Extension đã được chạy lệnh build ra tệp tin `plugin.zip` thành công.
- [ ] **Catalog Rebuilt**: Đã chạy lệnh `npm run build:catalog` và có thay đổi trong danh mục tổng.
- [ ] **Dọn dẹp log**: Không commit các tệp tin log sinh ra từ `tools/cli/reports/` lên git.
- [ ] **Thông tin nhạy cảm**: Không commit thông tin mật khẩu, token cấu hình Gitea cá nhân lên git.

---

## 🆘 5. Khắc phục sự cố thường gặp (Troubleshooting)

| Vấn đề gặp phải | Nguyên nhân phổ biến | Cách xử lý |
| :--- | :--- | :--- |
| **Lỗi đóng gói ZIP** | Thư mục thiếu file `plugin.json` ở gốc hoặc thiếu thư mục `src/` | Kiểm tra lại cấu trúc folder, đảm bảo có đủ các file yêu cầu |
| **Không tìm thấy extension mới** | Chưa chạy build catalog hoặc extension nằm trong folder private | Chạy lệnh `npm run build:catalog` và kiểm tra extension có nằm đúng thư mục `extensions/` hay không |
| **Lỗi giải mã sau khi mã hóa** | Tác giả hoặc Nguồn (Source) trong `plugin.json` bị lệch ký tự | Đảm bảo trường `source` và `author` khớp chính xác 100% với cấu hình lúc chạy lệnh mã hóa |
