# 🎬 Extension Mẫu cho Phim & Video (Video Template)

Bản mẫu chuẩn hóa dành cho các tiện ích xem phim và video truyền hình trên ứng dụng vBook.

---

## ⚡ Quy trình Khởi tạo & Lập trình (CLI Workflow)

> [!TIP]
> **KHÔNG TỰ TẠO THƯ MƯC THỦ CÔNG**: Hãy luôn sử dụng bộ công cụ dòng lệnh VBook CLI để sinh cấu trúc mẫu chuẩn xác nhất.

### 1️⃣ Khởi tạo extension mới từ bản mẫu
Chạy lệnh CLI sau ở gốc dự án để tạo thư mục extension mới:
```bash
npx vbook ext --mode create --name "Tên Nguồn Phim" --source "https://video-site.com" --type video
```

### 2️⃣ Hướng dẫn Phân luồng dữ liệu Video (Video Playback Flow)

Khác với các thể loại khác, Video Extension có cơ chế hoạt động qua 2 bước cuối đặc thù:

```text
chap.js (Trả về danh sách các Server/Nguồn phát dưới dạng JSON)
   ↓
Người dùng chọn Server phát trong App
   ↓
track.js (Nhận thông tin Server phát, cấu hình Header & loại luồng Video)
   ↓
exoplayer (Trình phát của App tự động giải mã m3u8/mp4 hoặc bắt luồng Webview)
```

#### Các loại luồng Video cấu hình trong `track.js`:
1. **`native`**: Video có link stream trực tiếp `.m3u8` hoặc `.mp4`. Trình phát gốc sẽ chạy cực kỳ mượt mà.
2. **`auto`**: Video dạng nhúng (iframe embed). App sẽ tải WebView ngầm để tự động quét bắt link video chạy bên trong iframe và phát.

### 3️⃣ Gỡ lỗi phân luồng Video (Debug)
```bash
# Debug lấy danh sách Server
npx vbook device debug extensions/video/kychi_ten_nguon/src/chap.js -in "https://video-site.com/tap-1"

# Debug lấy link stream/embed cuối cùng
npx vbook device debug extensions/video/kychi_ten_nguon/src/track.js -in "https://embed-site.com/play?id=123"
```

### 4️⃣ Đóng gói & Phát hành
```bash
npx vbook build --plugin extensions/video/kychi_ten_nguon
npx vbook build-catalog
```

---

## 📂 Cấu trúc các file đặc thù

* `src/detail.js`: Đảm bảo trả về thuộc tính `format: "series"` (cho phim bộ nhiều tập) hoặc `format: "movie"` (phim lẻ có nút xem ngay).
* `src/toc.js`: Trả về danh sách tập phim. Có thể chia server bằng `{ type: "section", name: "Tên Server" }`.
* `src/chap.js`: Đóng vai trò là **Server Picker**, trả về mảng các server và gói dữ liệu trung chuyển sang Track.
* `src/track.js`: **Bước cuối cùng**, trích xuất stream url cuối, gắn tag `type: "native"` hoặc `"auto"`, và cấu hình header `Referer` chống block 403.