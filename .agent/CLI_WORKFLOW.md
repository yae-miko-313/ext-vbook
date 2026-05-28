# 🛠️ Quy trình dòng lệnh (CLI Workflow) & Phân vùng VBook

Tài liệu này định nghĩa hệ thống phân vùng trong Kho lưu trữ (Repository partitions), hướng dẫn chi tiết các lệnh dòng lệnh (CLI commands) và quy trình đồng bộ danh mục dành cho Developer và Agent.

---

## 📂 1. Phân vùng Repository (Repository Partitions)

Để duy trì tính thống nhất giữa đóng góp chung của cộng đồng và các extension cá nhân bảo mật, repository của VBook được chia làm các phân vùng cụ thể sau:

| Phân vùng | Đường dẫn thư mục | Mục đích sử dụng | Git Status |
| :--- | :--- | :--- | :--- |
| **Cốt lõi (Core)** | `extensions/` + `tools/` | Quản lý, đóng gói và lưu trữ extension công khai | Được theo dõi (`tracked`) |
| **Cộng đồng (Community)** | `ref/` + `web/` | Nguồn tham khảo cộng đồng và giao diện Web Catalog | Được theo dõi (`tracked`) |
| **Cá nhân (Private)** | `.private/extensions/` | Chứa các extension cá nhân, thử nghiệm bảo mật | Bị bỏ qua (`gitignored`) |
| **Private Gitea** | `.tea-ext/` | Chứa extension được đóng gói để đưa lên server Gitea | Được theo dõi (`tracked`) |
| **Tài liệu (Docs)** | `docs/` + `.agent/` | Lưu trữ tri thức lập trình, quy tắc hệ thống | Được theo dõi (`tracked`) |

---

## 💻 2. Các lệnh CLI quan trọng (Core CLI Commands)

Bộ công cụ CLI được quản lý thông qua lệnh `vbook` hoặc các phím tắt `npm run`.

### A. Quản lý Extension
#### ➕ Tạo mới một extension
```bash
npm run ext:create -- --name <Tên_Extension> --source <URL_Nguồn>
```
* **Hoạt động**: Tự động sinh ra cấu trúc thư mục chuẩn tại `extensions/{loại}/{tác_giả}_{tên}` bao gồm `plugin.json` chứa metadata gốc và thư mục `src/` chứa các tệp mã nguồn JS trống.

#### 📝 Chỉnh sửa Metadata của extension
```bash
npm run ext:edit -- --plugin <đường_dẫn_folder_ext> --description "Mô tả mới"
```
* **Hoạt động**: Chỉ cập nhật trường thông tin trong `plugin.json`, giữ nguyên các file mã nguồn và tài nguyên khác.

### B. Đóng gói & Phát hành
#### 📦 Đóng gói thành ZIP
```bash
npm run build -- --plugin <đường_dẫn_folder_ext>
```
* **Hoạt động**: Biên dịch và nén toàn bộ thư mục `src/` cùng tệp `icon.png` thành tệp `plugin.zip` sẵn sàng phân phối.
* **Lưu ý**: Có thể sử dụng thêm flag `--dry-run` để chạy thử nghiệm đóng gói không sinh file thực tế.

#### 🗂️ Tái xây dựng Danh mục (Rebuild Catalog)
```bash
npm run build:catalog
```
* **Hoạt động**: Tự động quét toàn bộ các extension cá nhân và công khai, sinh lại các tệp `extensions/{type}/plugin.json` và tệp `extensions/plugin.json` tổng hợp.
* > [!IMPORTANT]
  > **Bắt buộc** phải chạy lệnh này trước khi commit hoặc tạo Pull Request nếu có bất kỳ sự thay đổi nào về danh sách extension hoặc metadata của chúng.

### C. Đồng bộ hóa Cộng đồng (Community Sync)
#### 🔄 Đồng bộ mã nguồn tham khảo
```bash
npm run sync-ref
```
* **Hoạt động**: Tải hoặc kéo các bản cập nhật mới nhất từ các repo cộng đồng về thư mục hỗ trợ chia sẻ `.private/code-reference/`.

#### 🌐 Đồng bộ hóa danh mục Web Portal
```bash
npm run sync:web-catalog
```
* **Hoạt động**: Đồng bộ dữ liệu sang phân vùng `web/` để phục vụ Web Viewer chạy chế độ realtime hoặc snapshot fallback. Lệnh này sẽ tạo ra các file:
  - `web/plugin.json` (Danh mục snapshot dự phòng theo loại)
  - `web/catalog.json` (Danh mục snapshot dự phòng theo nguồn)
  - `web/remote-sources.json` (Danh sách manifest nguồn thời gian thực)

---

## 🔄 3. Quy trình phát triển Tiêu chuẩn (Developer Workflow)

### Bước 1: Khảo sát & Phân tích (Research)
- Kiểm tra cấu trúc DOM / XHR hoạt động của trang web nguồn bằng DevTools của trình duyệt trước khi code.

### Bước 2: Tạo khung (Scaffold)
- Sử dụng lệnh CLI `ext:create` để khởi tạo thư mục. **Tuyệt đối không tự tạo thư mục bằng tay** để tránh sai sót cấu trúc.

### Bước 3: Phát triển (Implement)
- Viết mã nguồn trong thư mục `src/` tuân thủ nghiêm ngặt các hợp đồng API trong [docs/EXTENSION_DEVELOPMENT_GUIDE.md](file:///d:/My%20Code/vbook-tool/docs/EXTENSION_DEVELOPMENT_GUIDE.md).

### Bước 4: Đóng gói (Build)
- Chạy lệnh `npm run build` để đóng gói thành tệp ZIP hoàn chỉnh.

### Bước 5: Cập nhật Catalog (Sync)
- Chạy lệnh `npm run build:catalog` để đồng bộ hóa manifest tổng của toàn bộ dự án.

---

## ⚠️ 4. Các quy tắc quan trọng (Important Rules)

> [!WARNING]
> 1. **Không chỉnh sửa trực tiếp các tệp tin tổng hợp được tạo tự động**: Như `extensions/plugin.json` hay `web/plugin.json`. Chúng sẽ bị ghi đè hoàn toàn khi chạy script build.
> 2. **Không sửa trực tiếp file `plugin.json` của extension bằng tay**: Hãy ưu tiên dùng lệnh `npm run ext:edit` hoặc thực hiện thay đổi cẩn thận trước khi chạy lệnh build catalog.
> 3. **Dọn dẹp sau khi kiểm thử**: Các tệp tin log sinh ra tại `tools/cli/reports/` không được đưa vào lịch sử git (đã cấu hình gitignore, không cố ý bypass).
