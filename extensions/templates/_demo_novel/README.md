# 📘 Extension Mẫu cho Truyện Chữ (Novel Template)

Bản mẫu chuẩn hóa dành cho các tiện ích đọc truyện chữ (Novel/Chinese Novel) trên ứng dụng vBook.

---

## ⚡ Quy trình Khởi tạo & Lập trình (CLI Workflow)

> [!TIP]
> **KHÔNG TỰ TẠO THƯ MƯC THỦ CÔNG**: Hãy luôn sử dụng bộ công cụ dòng lệnh VBook CLI để sinh cấu trúc mẫu chuẩn xác nhất.

### 1️⃣ Khởi tạo extension mới từ bản mẫu
Chạy lệnh CLI sau ở gốc dự án để tạo thư mục extension mới:
```bash
npx vbook ext --mode create --name "Tên Nguồn Truyện" --source "https://site.com" --type novel
```

### 2️⃣ Cấu hình & Lập trình
* Tiến hành sửa đổi các file kịch bản trong thư mục `src/` (Title, Cover, Content...).
* Xem hướng dẫn lập trình chi tiết: [docs/EXTENSION_DEVELOPMENT_GUIDE.md](file:///d:/My%20Code/vbook-tool/docs/EXTENSION_DEVELOPMENT_GUIDE.md)

### 3️⃣ Kiểm tra tính tương thích (Validate)
Đảm bảo mã nguồn không sử dụng các cú pháp ES6+ không được nhân Rhino hỗ trợ:
```bash
npx vbook validate --plugin extensions/novel/kychi_ten_nguon
```

### 4️⃣ Chạy gỡ lỗi trực tiếp trên thiết bị (Debug)
Kết nối với app vBook qua mạng nội bộ và chạy thử nghiệm từng script:
```bash
npx vbook device debug extensions/novel/kychi_ten_nguon/src/detail.js -in "https://site.com/truyen-1"
```

### 5️⃣ Đóng gói & Phát hành
Đóng gói mã nguồn thành tệp ZIP phân phối chính thức và tái tạo chỉ mục:
```bash
npx vbook build --plugin extensions/novel/kychi_ten_nguon
npx vbook build-catalog
```

---

## 📂 Danh sách các file cốt lõi

* `plugin.json`: Quản lý thông tin metadata và định tuyến các file script chạy.
* `icon.png`: Ảnh đại diện của nguồn hiển thị trên App (64x64).
* `src/config.js`: Khởi tạo địa chỉ nguồn. **Bắt buộc dùng `let BASE_URL` (không dùng `const`)** để cho phép vBook inject địa chỉ động.
* `src/home.js`: Trả về danh sách đầu mục chuyên mục trang chủ.
* `src/genre.js`: Trả về danh sách danh mục các thể loại.
* `src/gen.js`: Trả về danh sách truyện theo phân trang.
* `src/search.js`: Logic tìm kiếm truyện theo từ khóa.
* `src/detail.js`: Lấy thông tin chi tiết truyện (tên, tác giả, trạng thái, thể loại).
* `src/toc.js`: Phân tích danh sách chương (Table of Contents).
* `src/chap.js`: Phân tích lấy mã HTML nội dung chương truyện chữ.