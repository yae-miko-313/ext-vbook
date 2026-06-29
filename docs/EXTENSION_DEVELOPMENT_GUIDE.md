# 📘 Cẩm nang Phát triển Extension VBook (Master Development Guide)

Tài liệu này là cẩm nang hướng dẫn toàn diện dành cho Developer và AI Agent khi tham gia xây dựng hoặc bảo trì các extension (tiện ích bổ sung) trong hệ sinh thái ứng dụng vBook.

---

## 🚀 1. Quy trình Phát triển Bắt buộc (Workflow Contract)

Mọi hoạt động phát triển extension phải tuân thủ nghiêm ngặt quy trình 5 bước khép kín sau:

```text
🔎 Nghiên cứu (Research) ──> 🛠️ Khởi tạo (Scaffold) ──> 💻 Lập trình (Implement) ──> 📦 Đóng gói (Build) ──> 🔄 Đồng bộ (Catalog Sync)
```

1. **Nghiên cứu (Research)**: Khảo sát trực tiếp cấu trúc HTML DOM hoặc các yêu cầu mạng (XHR/Fetch) trên trang web nguồn bằng DevTools của trình duyệt trước khi viết code.
2. **Khởi tạo (Scaffold)**: Sử dụng lệnh CLI `npm run ext:create` để khởi tạo cấu trúc thư mục tự động. **Không tự tạo thư mục thủ công**.
3. **Lập trình (Implement)**: Viết mã nguồn trong thư mục `src/` tuân thủ các quy tắc về môi trường chạy (Rhino Runtime) và Hợp đồng Script (Script Contract).
4. **Đóng gói (Build)**: Thực hiện đóng gói mã nguồn thành tệp `plugin.zip` bằng lệnh `npm run build:ext -- --plugin <path>`.
5. **Đồng bộ (Catalog Sync)**: Luôn cập nhật chỉ mục tổng bằng lệnh `npm run build:catalog` trước khi thực hiện commit lên Git.

---

## 📂 2. Cấu trúc Thư mục Extension chuẩn

Một extension VBook tiêu chuẩn bắt buộc phải được đặt trong thư mục `extensions/{thể_loại}/{tên_nguồn}/` với cấu trúc như sau:

```text
extensions/{loại_truyện}/{name}/
├── plugin.json          # Tệp cấu hình Metadata (chỉ sửa qua CLI hoặc khi thật sự cần thiết)
├── icon.png             # Icon hiển thị của nguồn (Kích thước khuyên dùng: 64x64 hoặc 128x128 pixel)
└── src/
    ├── config.js        # Cấu hình các hằng số, tiện ích dùng chung (được nạp tự động đầu tiên)
    ├── home.js          # Trang chủ / Danh sách tiêu biểu
    ├── genre.js         # (Tùy chọn) Danh mục các thể loại truyện
    ├── search.js        # Logic tìm kiếm truyện/phim
    ├── detail.js        # Logic phân tích trang thông tin chi tiết truyện/phim
    ├── toc.js           # Logic phân tích danh sách tập/chương (Table of Contents)
    ├── chap.js          # Logic lấy nội dung chương (Novel/Comic) hoặc Server Picker (Video)
    └── track.js         # (Chỉ dành cho Video) Logic trích xuất link stream video (.m3u8, .mp4)
```

---

## ⚡ 3. Ràng buộc Môi trường Rhino Runtime (ES5 Only)

Bộ nhân thực thi JavaScript trong ứng dụng vBook là **Rhino Engine** (chạy trên máy ảo Java của Android), **KHÔNG PHẢI là Node.js**. Do đó, cú pháp được hỗ trợ giới hạn ở chuẩn **ES5 cổ điển**.

### ✅ Các cú pháp ĐƯỢC PHÉP dùng:

- Khai báo biến bằng từ khóa: `var` (không dùng `let`, `const`).
- Khai báo hàm truyền thống: `function name() {}`.
- Các vòng lặp và câu lệnh rẽ nhánh: `if/else`, `for`, `while`, `try/catch`.
- Các hàm xử lý mảng cơ bản: `Array.forEach()`, `Array.map()`, `Array.filter()`, `Array.sort()`.
- Biểu thức chính quy (Regex), phân tích JSON (`JSON.parse`, `JSON.stringify`).
- Cơ chế nạp thư viện nội bộ: `load("tên_file.js")` (thường dùng để tải `config.js` hoặc `crypto.js`).

### ❌ Các cú pháp TUYỆT ĐỐI CẤM dùng (Sẽ gây lỗi biên dịch hoặc sập ứng dụng):

- Không dùng từ khóa khai báo biến hiện đại: `let`, `const`.
- Không dùng hàm mũi tên: `(arg) => {}`.
- Không dùng cú pháp bất đồng bộ: `async/await`, `Promise`.
- Không dùng toán tử tùy chọn (Optional Chaining): `?.` hoặc toán tử gán null: `??`.
- Không dùng cú pháp import/export mô-đun: `import`, `export`, `require`.
- Không dùng cú pháp Class phức tạp của ES6+.

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

var Response = {
  success: function (data, data2) {
    return JSON.stringify({ code: 0, data: data, data2: data2 });
  },
  error: function (data) {
    return JSON.stringify({ code: 1, data: data });
  },
};

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
    { title: "Truyện Mới Cập Nhật", input: "/latest", script: "gen.js" },
    { title: "Truyện Xem Nhiều", input: "/hot", script: "gen.js" },
  ];
  return Response.success(categories);
}
```

### C. Tệp `search.js` (Tìm kiếm)

```javascript
load("config.js");

function execute(input) {
  var keyword = input[0];
  var page = input[1] || 1;

  var searchUrl =
    BASE_URL + "/search?q=" + encodeURIComponent(keyword) + "&page=" + page;
  var response = fetch(searchUrl);

  if (!response.ok) return Response.success([]);

  var doc = response.html();
  var results = [];

  doc.select(".result-item").forEach(function (el) {
    results.push({
      id: el.select("a").first().attr("href"),
      title: cleanText(el.select(".title").text()),
      cover: el.select("img").first().attr("src"),
      desc: cleanText(el.select(".desc").text()),
      link: normalizeUrl(el.select("a").first().attr("href")),
    });
  });

  var next = null;
  var nextEl = doc.select(".next-page").first();
  if (nextEl) next = page + 1; // Hoặc đường dẫn cụ thể

  return Response.success(results, next ? String(next) : null);
}
```

### D. Tệp `detail.js` (Chi tiết truyện)

```javascript
load("config.js");

function execute(url) {
  url = normalizeUrl(url);
  var response = fetch(url);

  if (!response.ok) return Response.error("Không thể tải thông tin truyện");

  var doc = response.html();

  var genres = [];
  doc.select(".genre-item").forEach(function (g) {
    genres.push(cleanText(g.text()));
  });

  return Response.success({
    id: url,
    title: cleanText(doc.select("h1.book-title").text()),
    cover: doc.select(".book-cover img").first().attr("src"),
    author: cleanText(doc.select(".book-author").text()),
    description: cleanText(doc.select(".book-summary").html()),
    genres: genres,
    status: cleanText(doc.select(".book-status").text()),
    link: url,
  });
}
```

### E. Tệp `toc.js` (Danh sách chương)

```javascript
load("config.js");

function execute(url) {
  url = normalizeUrl(url);
  var response = fetch(url);

  if (!response.ok) return Response.success([]);

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

  if (!response.ok) return Response.error("Không thể tải nội dung chương");

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

- [ ] **Lỗi cú pháp Rhino**: Kiểm tra xem code có vô tình chứa `let`, `const`, `arrow function` hay `async/await` không.
- [ ] **Lỗi tải nạp config**: Tất cả các file script (trừ `config.js`) phải bắt đầu bằng lệnh `load('config.js')`.
- [ ] **Lỗi parse HTML**: Do giao diện website nguồn thay đổi CSS Selector. Hãy kiểm tra lại class/id trên trang web.
- [ ] **Lỗi Next Page**: Hãy đảm bảo biến `next` trả về từ `search.js` là một **chuỗi ký tự (String)**, không truyền dạng số (Number) trực tiếp.
- [ ] **Lỗi Đóng gói ZIP**: Thư mục extension bắt buộc phải chứa file `plugin.json` ở cấp cao nhất cùng thư mục `src/` và ảnh `icon.png` (nếu có).

---

## 🛡️ 7. Quy định Pháp lý & An toàn (Legal/Safety Rules)

1. **Ghi nhận đóng góp (Attribution)**: Luôn giữ nguyên thông tin tác giả `"author": "kychi"` hoặc các tác giả đóng góp ban đầu trong metadata, trừ khi có yêu cầu chuyển đổi cụ thể khác từ User.
2. **Không sao chép mù quáng (No Blind Copies)**: Không sao chép trực tiếp code từ các dự án khác mà không qua tinh chỉnh tương thích với cấu trúc của vBook.
3. **Quyền riêng tư (Private Extensions)**: Nếu extension đang thử nghiệm hoặc phục vụ mục đích cá nhân riêng tư, hãy đặt nó trong `.private/extensions/` để tránh bị hệ thống git quét và đẩy lên repository công khai.

---

## 💡 8. Mẹo Lập trình Nâng cao từ Bản mẫu (Advanced Coding Tips)

Dưới đây là các kỹ thuật lập trình nâng cao, được tối ưu hóa từ bộ bản mẫu chuẩn (`extensions/templates/`) giúp extension của bạn hoạt động thông minh và bền bỉ hơn.

### A. Chuẩn hóa Domain linh hoạt (Dynamic Domain Normalization)

Để đảm bảo script luôn trỏ đúng về địa chỉ cấu hình BASE_URL hiện tại (ngăn lỗi khi site đổi domain phụ hoặc redirect), hãy sử dụng biểu thức chính quy sau ở đầu các hàm `execute` để tự động thay thế phần host của URL đầu vào:

```javascript
url = url.replace(
  /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/gim,
  BASE_URL,
);
```

### B. Mã hóa đường dẫn ảnh an toàn (Safe Image URL Encoding)

Nhiều trang web chứa khoảng trắng hoặc ký tự Unicode trong đường dẫn ảnh bìa khiến trình phát của vBook không thể tải được. Hãy bọc logic xử lý ảnh bìa bằng cơ chế mã hóa thông minh sau:

```javascript
try {
  var urlObj = new URL(cover);
  // Chỉ mã hóa (encode) từng phân đoạn pathname để giữ nguyên cấu trúc URL gốc
  urlObj.pathname = urlObj.pathname
    .split("/")
    .map(function (p) {
      return encodeURIComponent(p);
    })
    .join("/");
  cover = urlObj.toString();
} catch (e) {
  // Fallback dự phòng nếu URL bị sai định dạng thô
  cover = encodeURI(cover);
}
```

### C. Cơ chế tiêm địa chỉ cấu hình động (`let BASE_URL`)

> [!NOTE]
> **Ngoại lệ về từ khóa `let`**: Trong tệp tin `config.js` của các bản mẫu, chúng ta bắt buộc sử dụng `let BASE_URL` thay thế cho `var` và tuyệt đối không dùng `const`.
> Điều này hỗ trợ nhân chạy của ứng dụng vBook có thể thực hiện cơ chế tiêm động (inject) cấu hình địa chỉ thay thế `CONFIG_URL` thông qua môi trường mà không bị crash hệ thống.

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
