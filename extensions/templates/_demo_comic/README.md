# 🎨 Extension Mẫu cho Truyện Tranh (Comic Template)

Bản mẫu chuẩn hóa dành cho các tiện ích đọc truyện tranh (Comic/Manga/Manhua) trên ứng dụng vBook.

---

## ⚡ Quy trình Khởi tạo & Lập trình (CLI Workflow)

> [!TIP]
> **KHÔNG TỰ TẠO THƯ MƯC THỦ CÔNG**: Hãy luôn sử dụng bộ công cụ dòng lệnh VBook CLI để sinh cấu trúc mẫu chuẩn xác nhất.

### 1️⃣ Khởi tạo extension mới từ bản mẫu
Chạy lệnh CLI sau ở gốc dự án để tạo thư mục extension mới:
```bash
npx vbook ext --mode create --name "Tên Nguồn Tranh" --source "https://manga-site.com" --type comic
```

### 2️⃣ Khác biệt cốt lõi so với Novel (Truyện chữ)

| Chỉ số | Novel (Truyện chữ) | Comic (Truyện tranh) |
| :--- | :--- | :--- |
| **Đầu ra chap.js** | Chuỗi HTML nội dung chữ | **Mảng danh sách các URL ảnh** (`Array<string>`) |
| **Xử lý ảnh** | App hiển thị text thường | Hỗ trợ Lazy-load và **vẽ lại mảnh ảnh mã hóa bằng Canvas** (`image.js`) |
| **Layout hiển thị** | Dọc trượt thường | Cuộn dọc khít màn hình (Webtoon) hoặc trượt ngang |

### 3️⃣ Kiểm tra tương thích & Chạy gỡ lỗi (Validate & Debug)
```bash
# Kiểm tra tương thích Rhino ES5
npx vbook validate --plugin extensions/comic/kychi_ten_nguon

# Gỡ lỗi lấy danh sách ảnh
npx vbook device debug extensions/comic/kychi_ten_nguon/src/chap.js -in "https://manga-site.com/chap-1"
```

### 4️⃣ Đóng gói & Phát hành
```bash
npx vbook build --plugin extensions/comic/kychi_ten_nguon
npx vbook build-catalog
```

---

## 📂 Danh sách các file kịch bản

* `src/config.js`: Chứa cấu hình gốc.
* `src/chap.js`: Logic phân tích lấy mảng toàn bộ link ảnh trong một chương. Hỗ trợ tự động chuyển đổi ảnh lazy-load.
* `src/image.js`: (Tùy chọn) Logic vẽ lại ảnh nếu nguồn có cơ chế chia cắt mảnh ảnh (sử dụng Canvas `Graphics`), hoặc bypass chống hotlink.