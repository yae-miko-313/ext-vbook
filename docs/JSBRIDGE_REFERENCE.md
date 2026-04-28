# 📚 vBook JSBridge API Reference

Tài liệu tra cứu các hàm API nội bộ (Bridge) được cung cấp trong môi trường chạy Script của vBook.

---

## 1. Network & HTTP

### `fetch(url, options)`

Hàm fetch cấp thấp, trả về đối tượng `HttpResponse`.

- **Options**: `{ method, headers, body, queries, timeout, cache }`
- **Ví dụ**: `var res = fetch("https://api.com", { method: "GET" });`

### `Http` (High-level Wrapper)

Bộ công cụ tiện dụng hơn để tạo request.

- `Http.get(url).headers(obj).queries(obj).string(charset)`
- `Http.post(url).body(data).string(charset)`

---

## 2. HTML Parsing (Jsoup Wrapper)

### `Html.parse(text)`

Chuyển đổi chuỗi HTML thành đối tượng `HtmlElement`.

### `HtmlElement` (Single Element)

- `.select(query)`: Trả về `HtmlElements`.
- `.attr(name)`: Lấy giá trị thuộc tính.
- `.text()`: Lấy nội dung văn bản.
- `.html()`: Lấy nội dung HTML bên trong.
- `.remove()`: Xóa phần tử.

### `HtmlElements` (Element List)

- `.size()` / `.length`: Số lượng phần tử.
- `.first()` / `.last()` / `.get(index)`: Truy cập phần tử cụ thể.
- `.forEach(callback)` / `.map(callback)`: Duyệt danh sách.

---

## 3. Browser & Engine (Headless Browser)

### `Engine.newBrowser()`

Khởi tạo một trình duyệt ngầm (WebView) để xử lý các trang web phức tạp (SPA, Cloudflare, v.v.)

- `.launch(url, timeout)`: Mở trang và trả về `HtmlElement` sau khi load xong.
- `.loadHtml(baseUrl, html)`: Load trực tiếp mã HTML.
- `.callJs(script, timeout)`: Thực thi code Javascript trong trang.
- `.setUserAgent(ua)`: Giả lập trình duyệt.
- `.close()`: Đóng trình duyệt (Bắt buộc để tránh tốn tài nguyên).

---

## 4. Storage & State

### `localStorage`

Lưu trữ dữ liệu vĩnh viễn (giống Web API).

- `.setItem(key, value)` / `.getItem(key)` / `.removeItem(key)`

### `cacheStorage`

Lưu trữ dữ liệu tạm thời (có thể bị xóa bởi hệ thống).

- Tương tự `localStorage`.

### `localCookie`

Quản lý Cookie của nguồn.

- `.setCookie(value)` / `.getCookie()`

---

## 5. Utilities

### `Log` / `Console`

- `Log.log(message)`: Ghi log ra màn hình debug của App.

### `UserAgent`

Các chuỗi User-Agent phổ biến.

- `UserAgent.system()`: UA mặc định của hệ thống.
- `UserAgent.chrome()` / `UserAgent.android()` / `UserAgent.ios()`

### `Script.execute(scriptName, functionName, input)`

Gọi thực thi một script khác trong cùng extension.

---

## 6. Advanced Features

### `WebSocket(url, headers)`

Kết nối thời gian thực qua giao thức WS.

- `.connect()`, `.send(data)`, `.receive()`, `.close()`.

### `Graphics` (Canvas)

Xử lý hình ảnh cấp thấp.

- `Graphics.createCanvas(w, h)` / `Graphics.createImage(base64)`.

---

### `sleep(ms)`

Tạm dừng luồng thực thi trong một khoảng thời gian.

---

> [!IMPORTANT]
> **Rhino Environment**: Môi trường chạy script là Rhino (Java), do đó chỉ hỗ trợ cú pháp **ES5**. Tránh dùng `let`, `const`, `arrow functions`, `async/await`.
