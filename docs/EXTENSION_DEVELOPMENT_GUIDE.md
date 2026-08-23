# 📘 Cẩm nang Phát triển Extension VBook (Master Development Guide)

Tài liệu này là cẩm nang hướng dẫn toàn diện dành cho Developer và AI Agent khi tham gia xây dựng hoặc bảo trì các extension (tiện ích bổ sung) trong hệ sinh thái ứng dụng vBook.

> 📌 **Lưu ý**: Tài liệu Hợp đồng Chi tiết và chính thức từ Admin vBook được lưu tại: [docs/extension-api.md](./extension-api.md) và Quy trình Kiểm tra tại [docs/verify-checklist.md](./verify-checklist.md).

---

## 🚀 1. Quy trình Phát triển Bắt buộc (Workflow Contract)

Mọi hoạt động phát triển extension phải tuân thủ nghiêm ngặt quy trình 5 bước khép kín sau:

```text
🔎 Nghiên cứu (Research) ──> 🛠️ Khởi tạo (Scaffold) ──> 💻 Lập trình (Implement) ──> ⚡ Kiểm thử (Test) ──> 📦 Đóng gói & Đồng bộ
```

1. **Nghiên cứu (Research)**: Khảo sát trực tiếp cấu trúc HTML DOM hoặc các yêu cầu mạng (XHR/Fetch) trên trang web nguồn bằng DevTools của trình duyệt trước khi viết code.
2. **Khởi tạo (Scaffold)**: Sử dụng lệnh CLI `npm run ext:create -- --name <Tên> --source <URL> --type <novel|comic|video|audio|tts|translate>` để tự động tạo cấu trúc từ bộ mẫu chuẩn admin trong `templates/{type}/`.
3. **Lập trình (Implement)**: Viết mã nguồn trong thư mục `src/` tuân thủ các quy tắc môi trường thực thực (Rhino ES6 Safe Mode) và Hợp đồng Script trong `docs/extension-api.md`.
4. **Kiểm thử (Test)**: Chạy test trực tiếp với VBook REST-API server bằng lệnh `npm run vbook:test -- <ext-folder> <script.js> [args...]`.
5. **Đóng gói & Đồng bộ (Build & Catalog Sync)**: Đóng gói bằng `npm run vbook:build -- <ext-folder>` và đồng bộ chỉ mục tổng bằng `npm run build:catalog` trước khi commit.

---

## 📂 2. Cấu trúc Thư mục Extension chuẩn

Một extension VBook tiêu chuẩn bắt buộc phải được đặt trong thư mục `extensions/{thể_loại}/{tác_giả}_{tên_nguồn}/` với cấu trúc như sau:

```text
extensions/{loại}/{author}_{name}/
├── plugin.json          # Tệp cấu hình Metadata (chỉ sửa qua CLI hoặc khi thật sự cần thiết)
├── icon.png             # Icon hiển thị của nguồn (Kích thước: 200x200 pixel)
└── src/
    ├── config.js        # Khai báo BASE_URL và normalizeUrl(url)
    ├── home.js          # Trang chủ / Tabs danh sách tiêu biểu
    ├── explore.js       # (Tùy chọn) Trang khám phá phân mục
    ├── genre.js         # (Tùy chọn) Danh mục thể loại truyện / phim
    ├── search.js        # Logic tìm kiếm
    ├── detail.js        # Logic phân tích thông tin chi tiết
    ├── toc.js           # Logic phân tích danh sách tập/chương (TOC)
    ├── chap.js          # Logic lấy nội dung chương (Novel) hoặc danh sách Server (Video/Audio)
    ├── page.js          # (Thay thế chap.js cho Comic) Danh sách link ảnh chương
    ├── track.js         # (Chỉ dành cho Video/Audio) Resolution link stream (.m3u8, .mp4)
    ├── voice.js / tts.js# (Dành cho loại TTS) Danh sách giọng đọc & tổng hợp âm thanh
    └── language.js / translate.js # (Dành cho loại Translate) Danh sách ngôn ngữ & dịch thuật
```

---

## ⚡ 3. Ràng buộc Môi trường Rhino Runtime (ES6 Safe Mode)

Bộ nhân thực thi JavaScript trong ứng dụng vBook là **Rhino 1.8.1 (ES6 Safe Subset)** running on Java Context `Context.VERSION_ES6`.

### ✅ Các cú pháp ĐƯỢC PHÉP dùng:

- Khai báo biến `let`, `const`, `var` (Lưu ý quy tắc cấm khai báo trùng key config bên dưới).
- Hàm `function`, vòng lặp `if/else`, `for`, `while`, `try/catch`.
- Các hàm mảng ES5/ES6 chuẩn: `forEach`, `map`, `filter`, `sort`, `reduce`.
- Regex, `JSON.parse`, `JSON.stringify`.
- Nạp thư viện nội bộ: `load("config.js")` (Lưu ý: `load` không đệ quy).

### ❌ Các quy tắc TUYỆT ĐỐI KHÔNG DÙNG & CẤM VI PHẠM:

1. **CẤM khai báo biến trùng tên với key trong `plugin.json.config`**:
   Mọi key trong config (như `DOMAIN`) đều được App tự động tiêm dưới dạng `const DOMAIN = "..."` trước khi script chạy. Khai báo lại (`let DOMAIN = ...`) sẽ gây lỗi **SyntaxError** hỏng toàn bộ script.
   👉 _Cách dùng chuẩn_: Khai báo `let BASE_URL = "https://...";` trong `config.js` rồi gán đè trong `try { if (typeof DOMAIN !== "undefined" && DOMAIN) BASE_URL = DOMAIN; } catch(e){}`.
2. **LUÔN KIỂM TRA `response.ok`**:
   Hàm `fetch()` không throw error khi gặp HTTP 40x/50x. Không bao giờ gọi `.html()`, `.json()`, `.text()` trước khi check `if (!response.ok) return Response.error("HTTP " + response.status);`.
3. **CÁC CÚ PHÁP CẤM DÙNG TRÊN RHINO**:
   - KHÔNG dùng `async/await`, `Promise`.
   - KHÔNG dùng Optional Chaining `?.` hoặc Nullish Coalescing `??`.
   - KHÔNG dùng Object/Array Spread (`{...obj}`).
   - KHÔNG dùng `Array.prototype.flat`/`flatMap`.
   - KHÔNG dùng import/export module.
   - KHÔNG gọi trực tiếp Java Reflection (`java.*`, `Packages.*`).

---

## 📑 4. Hợp đồng các Script chính (Script Contract)

Mỗi script trong thư mục `src/` thực hiện một vai trò chuyên biệt và phải trả về dữ liệu đúng định dạng JSON String thông qua lớp bao bọc `Response` chuẩn:

| Tên Script             | Tham số đầu vào (Input)                          | Định dạng dữ liệu trả về (Output)                                                                                                                                                               |
| :--------------------- | :----------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home.js` / `genre.js` | Không có                                         | `Response.success([{ title, input, script }])`                                                                                                                                                  |
| `search.js`            | `[keyword, page]` (Mảng gồm từ khóa và số trang) | `Response.success(list_items, next_page_string_or_null)`                                                                                                                                        |
| `detail.js`            | `url` (Chuỗi liên kết trang chi tiết)            | `Response.success(detail_object)`                                                                                                                                                               |
| `toc.js`               | `url` (Chuỗi liên kết trang chi tiết)            | `Response.success([{ name, url, host }])`                                                                                                                                                       |
| `chap.js`              | `url` (Liên kết chương từ `toc.js`)              | **Novel**: `Response.success(html_content_string)` <br> **Comic**: `Response.success([image_url_1, image_url_2, ...])` <br> **Video**: `Response.success([{ title, data }])` (Danh sách server) |
| `track.js`             | `input` (Dữ liệu server chọn từ `chap.js`)       | (Chỉ Video) `Response.success({ data, type, headers, host, timeSkip })`                                                                                                                         |

---

## 🎨 5. Các Code Pattern mẫu Chuẩn hóa

### A. Tệp `config.js` (Khởi tạo bắt buộc)

```javascript
var BASE_URL = "https://example.com";
var BASE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

function normalizeUrl(url) {
  if (!url) return "";
  url = String(url).trim();
  if (url.indexOf("http") === 0) return url;
  if (url.indexOf("//") === 0) return "https:" + url;
  if (url.indexOf("/") === 0) return BASE_URL + url;
  return BASE_URL + "/" + url;
}

function cleanText(text) {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * LƯU Ý: Đối tượng `Response` (Response.success / Response.error)
 * được tích hợp sẵn từ môi trường Host của vBook (không khai báo lại).
 */

/**
 * Kiểm tra kích thước an toàn cho Elements hoặc Mảng trong môi trường Rhino
 */
function getSize(els) {
  if (!els) return 0;
  try {
    if (typeof els.size === "function") return els.size();
    if (typeof els.size === "number") return els.size;
    if (typeof els.length === "number") return els.length;
  } catch (e) {}
  return 0;
}

/**
 * Truy cập phần tử an toàn tránh lỗi IndexOutOfBounds
 */
function getElement(els, index) {
  if (!els || getSize(els) <= index) return null;
  try {
    if (typeof els.get === "function") return els.get(index);
  } catch (e) {}
  return els[index];
}

/**
 * Gọi HTTP Request có tự động chèn các Header mặc định chống chặn cào
 */
function fetchPage(url, options) {
  if (!options) options = {};
  var headers = {
    "User-Agent": BASE_UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8",
    Referer: BASE_URL + "/",
  };
  if (options.headers) {
    for (var key in options.headers) {
      headers[key] = options.headers[key];
    }
  }
  options.headers = headers;
  return fetch(url, options);
}

/**
 * Tải HTML Document có tự động fallback sang Headless Browser khi cần render JS
 */
function loadDocument(url, timeout, requiredSelector) {
  var response = fetchPage(url);
  if (response.ok) {
    var doc = response.html();
    if (doc) {
      if (!requiredSelector) return doc;
      if (getSize(doc.select(requiredSelector)) > 0) return doc;
    }
  }
  // Fallback: Sử dụng Browser Engine nếu trang yêu cầu render JS phức tạp
  if (
    typeof Engine !== "undefined" &&
    Engine &&
    typeof Engine.newBrowser === "function"
  ) {
    try {
      var browser = Engine.newBrowser();
      var page = browser.launch(url, timeout || 15000);
      if (page) {
        if (!requiredSelector) {
          if (browser.close) browser.close();
          return page;
        }
        if (getSize(page.select(requiredSelector)) > 0) {
          if (browser.close) browser.close();
          return page;
        }
      }
      if (browser.close) browser.close();
    } catch (e) {}
  }
  return null;
}
```

### B. Tệp `home.js` (Danh sách chuyên mục)

```javascript
load("config.js");

function execute() {
  // Trả về danh sách các đầu mục tiêu biểu để App hiển thị
  var categories = [
    { title: "Truyện Mới Cập Nhật", input: "/latest", script: "genre.js" },
    { title: "Truyện Xem Nhiều", input: "/hot", script: "genre.js" },
  ];
  return Response.success(categories);
}
```

### C. Tệp `search.js` (Tìm kiếm)

```javascript
load("config.js");

function execute(query, page) {
  page = page || "1";
  var searchUrl =
    BASE_URL + "/search?q=" + encodeURIComponent(query) + "&page=" + page;
  var response = fetch(searchUrl);

  if (!response.ok) return Response.error("HTTP " + response.status);

  var doc = response.html();
  var results = [];

  doc.select(".result-item").forEach(function (el) {
    results.push({
      name: cleanText(el.select(".title").text()),
      link: normalizeUrl(el.select("a").first().attr("href")),
      cover: el.select("img").first().attr("src"),
      description: cleanText(el.select(".desc").text()),
      host: BASE_URL,
    });
  });

  var next = null;
  var nextEl = doc.select(".next-page").first();
  if (nextEl) next = String(parseInt(page, 10) + 1);

  return Response.success(results, next || "");
}
```

### D. Tệp `detail.js` (Chi tiết truyện)

```javascript
load("config.js");

function execute(url) {
  url = normalizeUrl(url);
  var response = fetch(url);

  if (!response.ok)
    return Response.error("Không thể tải thông tin truyện: " + response.status);

  var doc = response.html();

  var genres = [];
  doc.select(".genre-item").forEach(function (g) {
    genres.push(cleanText(g.text()));
  });

  return Response.success({
    name: cleanText(doc.select("h1.book-title").text()),
    cover: doc.select(".book-cover img").first().attr("src"),
    author: cleanText(doc.select(".book-author").text()),
    description: cleanText(doc.select(".book-summary").html()),
    genres: genres,
    status: cleanText(doc.select(".book-status").text()),
    host: BASE_URL,
  });
}
```

### E. Tệp `toc.js` (Danh sách chương)

```javascript
load("config.js");

function execute(url) {
  url = normalizeUrl(url);
  var response = fetch(url);

  if (!response.ok)
    return Response.error("Không thể tải TOC: " + response.status);

  var doc = response.html();
  var chapters = [];

  doc.select(".chapter-list a").forEach(function (el) {
    chapters.push({
      name: cleanText(el.text()),
      url: normalizeUrl(el.attr("href")),
      host: BASE_URL,
    });
  });

  return Response.success(chapters);
}
```

### F. Tệp `chap.js` (Nội dung chương truyện chữ)

```javascript
load("config.js");

function execute(url) {
  url = normalizeUrl(url);
  var response = fetch(url);

  if (!response.ok)
    return Response.error("Không thể tải nội dung chương: " + response.status);

  var doc = response.html();

  // Loại bỏ các thẻ quảng cáo, thẻ rác trong nội dung truyện chữ
  var contentEl = doc.select(".chapter-content").first();
  if (contentEl) {
    contentEl.select("script, style, .ads-class").remove();
    var htmlContent = contentEl.html();
    return Response.success(htmlContent);
  }

  return Response.error("Nội dung trống");
}
```

---

## 🛠️ 6. Bảng Checklist gỡ lỗi thông minh (Debug Checklist)

Khi extension gặp lỗi hoặc chạy không đúng mong đợi trên ứng dụng, hãy kiểm tra danh sách sau:

- [ ] **Lỗi cú pháp trùng key config**: Đảm bảo KHÔNG khai báo `let DOMAIN` hay `const DOMAIN` vì App tự tiêm `DOMAIN`.
- [ ] **Lỗi kiểm tra HTTP**: Đảm bảo luôn kiểm tra `if (!response.ok)` trước khi gọi `.html()`, `.json()`, `.text()`.
- [ ] **Lỗi tải nạp config**: Tất cả các file script (trừ `config.js`) phải bắt đầu bằng lệnh `load('config.js')`.
- [ ] **Lỗi parse HTML**: Do giao diện website nguồn thay đổi CSS Selector. Hãy kiểm tra lại class/id trên trang web.
- [ ] **Lỗi Next Page**: Hãy đảm bảo biến `next` (data2) trả về từ `search.js` là một **chuỗi ký tự (String)** hoặc `""` (không dùng null hay số).
- [ ] **Lỗi Đóng gói ZIP**: Thư mục extension bắt buộc phải chứa file `plugin.json` ở cấp cao nhất cùng thư mục `src/` và ảnh `icon.png`.

---

## 🛡️ 7. Quy định Pháp lý & An toàn (Legal/Safety Rules)

1. **Ghi nhận đóng góp (Attribution)**: Luôn giữ nguyên thông tin tác giả `"author": "hieu05"` hoặc các tác giả đóng góp ban đầu trong metadata, trừ khi có yêu cầu chuyển đổi cụ thể khác từ User.
2. **Không sao chép mù quáng (No Blind Copies)**: Không sao chép trực tiếp code từ các dự án khác mà không qua tinh chỉnh tương thích với cấu trúc của vBook.
3. **Quyền riêng tư (Private Extensions)**: Nếu extension đang thử nghiệm hoặc phục vụ mục đích cá nhân riêng tư, hãy đặt nó trong `.private/extensions/` để tránh bị hệ thống git quét và đẩy lên repository công khai.

---

## 💡 8. Kỹ thuật Lập trình Nâng cao từ Starter Templates

Dưới đây là các kỹ thuật lập trình nâng cao, được tối ưu hóa từ bộ bản mẫu chuẩn admin (`templates/{type}/`) giúp extension của bạn hoạt động thông minh và bền bỉ hơn.

### A. Cơ chế đè địa chỉ cấu hình động (`config.js`)

Trong `config.js`, chúng ta khởi tạo `BASE_URL` mặc định, sau đó đè bằng `DOMAIN` (được App tiêm tự động) trong khối `try/catch`:

```javascript
let BASE_URL = "https://example.com";
try {
  if (typeof DOMAIN !== "undefined" && DOMAIN) {
    BASE_URL = DOMAIN;
  }
} catch (e) {}
```

> [!IMPORTANT]
> Không bao giờ khai báo `let DOMAIN = ...` hoặc `const DOMAIN = ...` vì App tiêm `const DOMAIN` sẵn trước khi script chạy. Khai báo trùng gây `SyntaxError`.

### B. Chuẩn hóa URL trang nguồn (`normalizeUrl`)

Hàm `normalizeUrl` trong `config.js` dùng để thay thế host của URL truyền vào bằng `BASE_URL` hiện tại:

```javascript
function normalizeUrl(url) {
  if (!url) return "";
  url = String(url).trim();
  return url.replace(
    /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/gim,
    BASE_URL,
  );
}
```

### D. Xử lý ảnh trễ (Lazy-load Images) trong Comic Extension

Khi bóc tách danh sách ảnh trong `chap.js` của Comic, nhiều trang web ẩn link ảnh thật dưới dạng thuộc tính `data-src` hoặc `data-lazy-src`. Bản mẫu Comic cung cấp bộ giải pháp duyệt và gán ngược cực kỳ tối ưu:

```javascript
// Quét và đưa link thật từ lazy attribute vào thuộc tính src chính thống
container.select("img[data-src]").forEach(function (img) {
  var lazySrc = img.attr("data-src") + "";
  if (lazySrc) img.attr("src", lazySrc);
});
container.select("img[data-lazy-src]").forEach(function (img) {
  var lazySrc = img.attr("data-lazy-src") + "";
  if (lazySrc) img.attr("src", lazySrc);
});
```
