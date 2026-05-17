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
| `chap.js` | Danh sách Server & **Trích xuất Stream URL / Embed Link** | `[{ title, data }, ...]` |
| `track.js` | Cấu hình Header & Loại Stream | `{ data, type, headers, ... }` |

**Nguyên tắc cốt lõi thực tế:**
- Logic bóc tách luồng (tìm `.m3u8` hoặc link iframe embed) nên được xử lý và hoàn tất ngay ở `chap.js`.
- `track.js` đóng vai trò trung chuyển, mục đích chính là cấu hình các Headers bắt buộc (Referer, User-Agent) và định nghĩa loại luồng. Tránh gọi `fetch` hay parse DOM dư thừa ở bước này.
- Tiêu chuẩn bóc tách: Ưu tiên lấy dữ liệu từ JSON/Hydration data (VD: biến `__NEXT_DATA__`, `all_sources`) thay vì parse DOM HTML để tối ưu tốc độ và tránh bị block bởi hệ thống anti-scraping.

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
    return Response.success({
        name: "Tên phim",
        cover: "https://.../poster.jpg",
        author: "Đạo diễn/Studio",
        description: "Nội dung phim chi tiết",
        detail: "Năm: 2024<br>Trạng thái: Hoàn thành",
        ongoing: false,
        format: "series", // QUAN TRỌNG
        host: "https://website-phim.com"
    });
}
```

### B. TOC Script (`toc.js`)

Trả về danh sách các tập phim. Lưu ý tránh liệt kê trùng lặp bằng cách chuẩn hóa URL ngay tại bước này. Có thể phân chia theo Server bằng `type: "section"`.

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

Đóng vai trò là **Server Picker** và **Stream Extractor**. Khi user nhấn vào 1 tập, app sẽ gọi script này để lấy danh sách các nguồn phát.
`chap.js` cần giải quyết việc bóc tách stream link (`.m3u8` hoặc `embed url`) để truyền sang Track.

```javascript
function execute(url) {
    // Parse stream url hoặc embed url trực tiếp ở đây
    var streamUrl = "https://.../playlist.m3u8"; 
    
    let servers = [
        { 
            title: "Nguồn VIP", 
            // data truyền sang track.js có thể là JSON string để gói cả URL và Referer
            data: JSON.stringify({ url: streamUrl, referer: url }) 
        }
    ];
    return Response.success(servers);
}
```

### D. Track Script (`track.js`)

Là bước Stream xử lý cuối cùng. Trách nhiệm chính là nhận data thô từ `chap.js`, cấu hình header chống block, và gắn tag định dạng luồng (`type`).

```javascript
load('config.js');

function execute(input) {
    var data = {};
    try {
        data = JSON.parse(input);
    } catch (e) {
        data = { url: input, referer: DEFAULT_REFERER };
    }

    // Các kiểu stream phổ biến: 'native', 'auto'
    return Response.success({
        data: data.url, 
        type: "native", 
        headers: {
            "User-Agent": "Mozilla/5.0 ...",
            "Referer": data.referer 
        },
        timeSkip: [
            { start: 0, end: 90 } // Bỏ qua 90s đầu (Intro)
        ]
    });
}
```

---

## 4. Các loại luồng Video (`type` trong `track.js`)

1. **`native`**: Dùng cho link stream trực tiếp như `.m3u8` hoặc `.mp4`. Trình phát gốc (Native Player) của vBook sẽ xử lý luồng này trực tiếp. Luôn ưu tiên bóc tách ra được link kiểu này.
2. **`auto`**: Dùng cho các link Embed. Do App không hỗ trợ nhúng iframe trực tiếp, nên với type `auto`, App sẽ bắt link video từ trang embed và tự động phát, kết hợp với các headers được cấu hình từ `track.js`.

---

## 5. Mẹo & Thủ thuật (Best Practices)

- **Hạn Chế DOM Parsing**: Hạn chế gọi `fetch()` dư thừa. Ưu tiên xài Regex trích xuất dữ liệu JSON (VD: `__NEXT_DATA__` của Next.js hay biến JS chứa mảng sources) ngay từ HTML thô. Hạn chế sử dụng bộ phân tích HTML/DOM nặng nề.
- **Caching**: Sử dụng `fetch(url, { cache: 86400 })` cho các trang Detail/TOC để tăng tốc độ phản hồi.
- **Bypass 403 & Header Cứng**: Nếu Video bị block 403 Forbidden, 99% nguyên nhân là do thiếu hoặc sai `Referer` / `User-Agent`. Cần kiểm tra kỹ Network tab trên trình duyệt để copy đúng Header vào `track.js`.
- **Rhino Runtime**: Tuyệt đối không dùng `async/await`, `const/let` (hãy dùng `var`), hoặc các cú pháp ES2015+ hiện đại. Javascript của Extension được chạy trên Rhino Engine (Android).

---

> [!TIP]
> Bạn có thể tham khảo mã nguồn thực tế của các video extension trong dự án để nắm rõ cấu trúc bóc tách dữ liệu chuẩn nhất.
