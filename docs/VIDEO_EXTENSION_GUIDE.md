# 🎬 vBook Video Extension Development Guide

Tài liệu này hướng dẫn chi tiết cách phát triển Extension loại **Video** cho hệ sinh thái vBook (Hiện hỗ trợ tốt nhất trên bản Beta).

---

## 1. Tổng quan Architecture

Khác với Novel/Comic, Video Extension có quy trình lấy dữ liệu qua 2 bước cuối:

`Home -> Detail -> TOC (Episodes) -> Chap (Servers) -> Track (Stream Link)`

| Script | Vai trò | Trả về |
| :--- | :--- | :--- |
| `home.js` | Danh sách mục ở trang chủ | `Response.success([...])` |
| `detail.js` | Thông tin chi tiết phim | `{ name, cover, format, ... }` |
| `toc.js` | Danh sách tập phim | `[{ name, url }, ...]` |
| `chap.js` | Danh sách Server cho tập đó | `[{ title, data }, ...]` |
| `track.js` | Xử lý link stream cuối cùng | `{ data, type, headers, ... }` |

---

## 2. Cấu hình Metadata (`plugin.json`)

Bắt buộc trường `type` phải là `"video"`.

```json
{
  "metadata": {
    "name": "My Video Ext",
    "author": "Developer",
    "version": 1,
    "source": "https://website-phim.com",
    "regexp": "website-phim.com/phim/.*",
    "description": "Xem phim miễn phí",
    "locale": "vi_VN",
    "type": "video",
    "language": "javascript"
  },
  "script": {
    "home": "home.js",
    "detail": "detail.js",
    "toc": "toc.js",
    "chap": "chap.js",
    "track": "track.js"
  }
}
```

---

## 3. Chi tiết các Script & Snippets

### A. Detail Script (`detail.js`)

Cần lưu ý trường `format` để App hiển thị giao diện phù hợp.

- `format: "series"`: Hiển thị danh sách tập (phim bộ).
- `format: "movie"`: Hiển thị nút "Xem ngay" (phim lẻ).

```javascript
function execute(url) {
    // ... fetch dữ liệu từ url ...
    return Response.success({
        name: "Tên phim",
        cover: "https://.../poster.jpg",
        author: "Đạo diễn/Studio",
        description: "Nội dung phim",
        detail: "Năm: 2024<br>Trạng thái: Hoàn thành",
        ongoing: false,
        format: "series", // QUAN TRỌNG
        host: "https://website-phim.com"
    });
}
```

### B. TOC Script (`toc.js`)

Trả về danh sách các tập phim. Có thể phân chia theo Server bằng `type: "section"`.

```javascript
function execute(url) {
    let list = [];
    // Thêm phân vùng Server 1
    list.push({ name: "Server Vietsub", type: "section" });
    list.push({ name: "Tập 1", url: "https://.../tap-1", host: "..." });
    list.push({ name: "Tập 2", url: "https://.../tap-2", host: "..." });
    
    return Response.success(list);
}
```

### C. Chap Script (`chap.js`)

Đóng vai trò là **Server Picker**. Khi user nhấn vào 1 tập, app sẽ gọi script này để lấy danh sách các nguồn phát.

```javascript
function execute(url) {
    // url là link tập phim từ toc.js
    let servers = [
        { title: "Nguồn VIP", data: "https://.../api/get-link?id=123" },
        { title: "Nguồn Dự Phòng", data: "https://.../player?v=abc" }
    ];
    return Response.success(servers);
}
```

### D. Track Script (`track.js`)

Đây là bước cuối cùng. App sẽ lấy `data` từ `chap.js` đưa vào đây để lấy link stream thực tế.

```javascript
function execute(data) {
    // data có thể là link stream trực tiếp hoặc link cần giải mã
    return Response.success({
        data: data, 
        type: "native", // "native" (HLS/m3u8), "iframe", hoặc "auto"
        headers: {
            "User-Agent": "...",
            "Referer": "https://website-phim.com/"
        },
        timeSkip: [
            { start: 0, end: 90 } // Bỏ qua 90s đầu (Intro)
        ]
    });
}
```

---

## 4. Các loại luồng Video (`type` trong `track.js`)

1. **`native`**: Dùng cho link trực tiếp `.m3u8` hoặc `.mp4`. Player của vBook sẽ tự xử lý.
2. **`iframe`**: Dùng khi web phim bắt buộc dùng trình phát của họ. vBook sẽ nhúng link vào một webview.// KHÔNG CÓ IFRAME ĐÂU, DÙNG AUTO CHO CÁC LINK EMBED
3. **`auto`**: Để hệ thống tự nhận diện dựa trên header `Content-Type`.

---

## 5. Mẹo & Thủ thuật (Best Practices)

- **Caching**: Sử dụng `fetch(url, { cache: 86400 })` cho các trang detail hoặc toc để tăng tốc độ load.
- **Bypass**: Nếu gặp lỗi 403, hãy luôn kiểm tra `Referer` và `Origin` trong `headers` của `track.js`.
- **Rhino Runtime**: Tuyệt đối không dùng `async/await`, `const/let` (nên dùng `var`), hoặc các cú pháp ES6+ quá mới vì môi trường chạy script của vBook là Rhino (Android).

---

> [!NOTE]
> Bạn có thể tham khảo code thực tế tại thư mục `.private/code-reference/video/kkphim` để xem cách xử lý API JSON một cách chuyên nghiệp.
