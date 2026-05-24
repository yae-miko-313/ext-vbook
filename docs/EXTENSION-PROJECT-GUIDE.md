# Extension Project Guide - Context cho Agent mới

Tài liệu này tổng hợp từ `docs/AI_CODE_EXT_VBOOK.md` và `docs/VIDEO_EXTENSION_GUIDE.md` để agent mới hiểu nhanh cấu trúc extension.

---

## 1. Workflow bắt buộc

`Research -> Implement -> Edit metadata -> Build -> Rebuild catalog`

1. **Research**: Kiểm tra DOM/XHR live site trước khi code
2. **Implement**: Viết code trong `src/` theo contract
3. **Edit metadata**: Dùng `vbook ext --mode edit` để cập nhật `plugin.json`
4. **Build**: `npx vbook build --plugin <path>`
5. **Rebuild catalog**: `npx vbook build-catalog`

---

## 2. Cấu trúc thư mục

```text
extensions/{category}/{author}_{name}/
├── plugin.json          # Metadata
├── icon.png             # Icon extension
└── src/
    ├── config.js        # Constants + utils (load đầu tiên)
    ├── home.js          # Trang chủ
    ├── genre.js         # Danh sách thể loại
    ├── search.js        # Tìm kiếm
    ├── detail.js        # Chi tiết
    ├── toc.js           # Danh sách tập/chương
    ├── chap.js          # Server picker (novel/comic/video)
    └── track.js         # Lấy URL video (chỉ video extension)
```

---

## 3. Rhino Runtime Contract (ES5 only)

### Được dùng

- `var`, `function`, `if/else`, `for`, `while`, `try/catch`
- Regex, `JSON.parse/stringify`, `Array.forEach/map/filter`
- `load("config.js")`

### Không dùng

- `import/export`
- `async/await`, `Promise`
- Optional chaining `?.`, nullish `??`
- `let/const` (chỉ dùng `var`)
- Class syntax phức tạp

---

## 4. Script Contract

| Script | Input | Output |
| :--- | :--- | :--- |
| `home.js` / `genre.js` | - | `[{ title, input, script }]` |
| `gen.js` / `search.js` | keyword, page | `Response.success(list, next?)` |
| `detail.js` | URL | Object detail |
| `toc.js` | URL | Danh sách tập/chương |
| `chap.js` | URL | List server (video) hoặc nội dung (novel) |
| `track.js` | URL/data | `{ data, type, headers, ... }` |

---

## 5. Code Pattern mẫu

### config.js (Bắt buộc)

```javascript
var BASE_URL = "https://example.com";

function normalizeUrl(url) {
    if (!url) return "";
    if (url.indexOf("http") !== 0) {
        if (url.indexOf("/") === 0) url = BASE_URL + url;
        else url = BASE_URL + "/" + url;
    }
    return url.replace(/\/$/, "");
}

function cleanText(text) {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
}

var Response = {
    success: function(data, data2) {
        return JSON.stringify({ code: 0, data: data, data2: data2 });
    },
    error: function(data) {
        return JSON.stringify({ code: 1, data: data });
    }
};
```

### home.js

```javascript
load('config.js');

function execute() {
    var response = fetch(BASE_URL);
    if (!response.ok) return Response.success([]);
    
    var doc = response.html();
    var items = [];
    
    doc.select(".item").forEach(function(el) {
        items.push({
            id: el.attr("href"),
            title: cleanText(el.text()),
            cover: el.select("img").first().attr("src"),
            link: normalizeUrl(el.attr("href"))
        });
    });
    
    return Response.success(items);
}
```

### search.js

```javascript
load('config.js');

// Input: ["từ khóa", trang]
function execute(input) {
    var keyword = input[0];
    var page = input[1] || 1;
    
    var searchUrl = BASE_URL + "/search?q=" + encodeURIComponent(keyword) + "&page=" + page;
    var response = fetch(searchUrl);
    
    if (!response.ok) return Response.success([]);
    
    var doc = response.html();
    var results = [];
    
    doc.select(".result-item").forEach(function(el) {
        results.push({
            id: el.select("a").first().attr("href"),
            title: cleanText(el.select(".title").text()),
            cover: el.select("img").first().attr("src"),
            desc: cleanText(el.select(".desc").text()),
            link: normalizeUrl(el.select("a").first().attr("href"))
        });
    });
    
    return Response.success(results);
}
```

### detail.js

```javascript
load('config.js');

// Input: URL trang detail
function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url);
    
    if (!response.ok) return Response.error("Lỗi tải trang");
    
    var doc = response.html();
    
    return Response.success({
        id: url.match(/\/(\d+)/)[1],
        title: cleanText(doc.select("h1.title").text()),
        cover: doc.select(".cover img").first().attr("src"),
        author: cleanText(doc.select(".author").text()),
        description: cleanText(doc.select(".desc").html()),
        genres: doc.select(".genre").map(function(g) { return g.text(); }),
        status: doc.select(".status").text(),
        link: url
    });
}
```

### toc.js

```javascript
load('config.js');

// Input: URL trang detail
function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url);
    
    if (!response.ok) return Response.success([]);
    
    var doc = response.html();
    var chapters = [];
    
    // Với video: phân chia server bằng type: "section"
    doc.select("#playlist1 a").forEach(function(el, index) {
        chapters.push({
            name: "Tập " + (index + 1) + ": " + cleanText(el.text()),
            url: normalizeUrl(el.attr("href")),
            host: BASE_URL
        });
    });
    
    // Sort theo số tập nếu cần
    chapters.sort(function(a, b) {
        var numA = (a.url.match(/-ep(\d+)/) || [0,0])[1];
        var numB = (b.url.match(/-ep(\d+)/) || [0,0])[1];
        return parseInt(numA, 10) - parseInt(numB, 10);
    });
    
    return Response.success(chapters);
}
```

### chap.js (Video - Server Picker)

```javascript
load('config.js');

// Input: URL tập phim từ toc.js
function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url);
    
    if (!response.ok) return Response.success([]);
    
    var doc = response.html();
    var servers = [];
    
    // Tìm tất cả server từ trang
    var svMatch = url.match(/-sv(\d+)-/);
    var currentSv = svMatch ? svMatch[1] : "1";
    
    // Parse các server khác từ trang
    doc.select("#links-backup a").forEach(function(el) {
        var href = el.attr("href");
        var svNum = href.match(/-sv(\d+)-/);
        if (svNum) {
            servers.push({
                title: "Server " + svNum[1],
                data: normalizeUrl(href)
            });
        }
    });
    
    // Nếu không có server list, trả về URL gốc
    if (servers.length === 0) {
        servers.push({
            title: "Server " + currentSv,
            data: url
        });
    }
    
    return Response.success(servers);
}
```

### track.js (Video)

```javascript
load('config.js');

// Input: URL hoặc array
function execute(input) {
    var url;
    if (typeof input === "string") url = input;
    else if (Array.isArray(input)) url = input[0];
    else if (input && input.url) url = input.url;
    
    url = normalizeUrl(url);
    var response = fetch(url, { headers: { "Referer": BASE_URL } });
    
    if (!response.ok) {
        return Response.success({ data: url, type: "auto", host: BASE_URL });
    }
    
    var html = response.text();
    
    // Extract video URL từ player_aaaa hoặc các pattern khác
    var videoUrl = "";
    var match = html.match(/"url"\s*:\s*"([^"]+)"/);
    if (match) videoUrl = match[1].replace(/\\\//g, "/");
    
    // Xác định type
    var type = "auto";
    if (videoUrl.match(/\.(mp4|m3u8|webm)/i)) type = "native";
    
    return Response.success({
        data: videoUrl,
        type: type,
        headers: { "Referer": BASE_URL },
        host: BASE_URL,
        timeSkip: []
    });
}
```

---

## 6. Metadata Contract (plugin.json)

```json
{
  "metadata": {
    "name": "Tên hiển thị",
    "author": "tên_author",
    "version": 1,
    "source": "https://example.com",
    "regexp": "(www\\.)?example\\.com/.*",
    "description": "Mô tả ngắn",
    "locale": "vi_VN",
    "type": "novel|video|comic|chinese_novel|translate|tts",
    "language": "javascript"
  },
  "script": {
    "home": "home.js",
    "genre": "genre.js",
    "detail": "detail.js",
    "search": "search.js",
    "toc": "toc.js",
    "chap": "chap.js",
    "track": "track.js"
  }
}
```

**Lưu ý quan trọng**

- `metadata.source`: URL gốc của nguồn
- `metadata.author`: Giữ nguyên attribution
- `script` map đến tên file trong `src/`

---

### Phân vùng Repo

| Phân vùng | Mục đích |
| :--- | :--- |
| `extensions/` + `tools/cli/` | Phân vùng cốt lõi (Core) - Quản lý & Build Extension |
| `.private/extensions/` | Phân vùng cá nhân private |
| `vbook-web-service/` | Phân vùng Web & API Portal (chuẩn bị tách repo) |
| `.private/code-reference/` | Code reference cho agent |
| `docs/` | Tài liệu hướng dẫn |

**Khi viết extension**: Chỉ quan tâm tới `extensions/`. Việc hiển thị lên web portal được xử lý bởi API trong folder web service.

---

## 8. Video Extension đặc thù

**Luồng riêng**: `Home -> Detail -> TOC -> Chap (Servers) -> Track (Stream)`

#### Track output

```javascript
{
  data: "https://.../video.mp4",     // URL stream
  type: "native",                     // "native" | "iframe" | "auto"
  headers: {                          // Headers cần thiết
    "Referer": "https://example.com/",
    "User-Agent": "..."
  },
  host: "https://example.com",
  timeSkip: [{ start: 0, end: 90 }]  // Bỏ qua intro nếu cần
}
```

#### Type luồng

- `native`: Link trực tiếp `.m3u8` hoặc `.mp4`. Player vBook tự xử lý.
- `iframe`: Nhúng trình phát của site vào webview.
- `auto`: Để hệ thống tự nhận diện.

---

### Debug Checklist

- [ ] Lỗi parse HTML: Kiểm tra selector đã đổi trên site
- [ ] Lỗi page next: `next` nên trả về string
- [ ] Lỗi runtime: Đảm bảo có `execute` và không dùng syntax không hỗ trợ
- [ ] Lỗi duplicate policy: Tránh tạo extension trùng `source + author`
- [ ] Lỗi 403: Kiểm tra `Referer` và `User-Agent` trong headers

---

## 10. Legal/Safety Rules

- Không đưa code copy blind từ repo ngoài
- Không merge extension vi phạm policy nội bộ
- Luôn review lại source và metadata trước khi commit
- Nếu ext không muốn public: Đặt trong `.private/extensions/**`

---

## 📚 Đọc thêm

- `docs/AI_CODE_EXT_VBOOK.md` - Agent guide chi tiết
- `docs/VIDEO_EXTENSION_GUIDE.md` - Video extension chi tiết
- `docs/JSBRIDGE_REFERENCE.md` - Tra cứu hàm API JSBridge
- `docs/CONTRIBUTING.md` - Contributing guidelines
- `.private/code-reference/` - Code mẫu tham khảo

---

_Guide tổng hợp từ docs/ cho agent mới tạo extension_
