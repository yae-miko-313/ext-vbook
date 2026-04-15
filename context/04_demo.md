# 04_demo.md — Scripts & Plugin Reference

> Code examples for all script types. Core reference for implementation.

---

## Directory Structure
```
ext-name/
├── plugin.json*
├── icon.png* (64x64)
├── src/
│   ├── config.js   (required — BASE_URL)
│   ├── detail.js*  (required)
│   ├── page.js*    (required — dùng mặc định, xem giải thích bên dưới)
│   ├── toc.js*     (required)
│   ├── chap.js*    (required)
│   ├── home.js     (optional)
│   ├── genre.js    (optional)
│   ├── gen.js      (optional — script dùng cho home/genre tab)
│   └── search.js   (optional)
```

---

## plugin.json
```json
{
  "metadata": {
    "name": "Tên Extension",
    "author": "B",
    "version": 1,
    "source": "https://domain.net",
    "regexp": "https?:\\/\\/(?:www\\.)?domain\\.net\\/truyen\\/[a-zA-Z0-9-]+\\/?$",
    "description": "Mô tả",
    "locale": "vi_VN",
    "language": "javascript",
    "type": "novel",
    "tag": "nsfw"
  },
  "script": {
    "home": "home.js",
    "genre": "genre.js",
    "detail": "detail.js",
    "search": "search.js",
    "page": "page.js",
    "toc": "toc.js",
    "chap": "chap.js"
  }
}
```

**CRITICAL:**
- `regexp`: MUST match detail page ONLY (end with `\\/?$`)
- `script` paths: NO `src/` prefix
- `author`: read from `vbook-tool/.env`

---

## Luồng dữ liệu giữa các script

### Luồng Home / Genre → Danh sách truyện

```
home.js → execute()
  └─ trả về [{title, input, script}]
       └─ gen.js → execute(url=input, page="")
            └─ trả về [{name, link, cover, description, host}], next
                 └─ gen.js → execute(url=input, page=next)  ← lặp đến next=null
```

```
genre.js → execute()
  └─ trả về [{title, input, script}]
       └─ gen.js → execute(url=input, page="")   ← cùng pattern như home
```

### Luồng Mục lục (bắt buộc dùng page.js làm trung gian)

```
detail.js → execute(url)
  └─ trả về {name, cover, host, author, ...}

page.js → execute(url)          ← url = url của detail
  └─ trả về [pageUrl1, pageUrl2, ...]
       ← Nếu KHÔNG có phân trang: trả về [url] (chính là url detail)
       ← Nếu CÓ phân trang: trả về list URL từng trang mục lục

toc.js → execute(url)           ← url = từng item trong mảng page.js trả về
  └─ trả về [{name, url, host}]
       ← Mỗi call toc.js = 1 page mục lục
       ← App tổng hợp tất cả kết quả từ các call

chap.js → execute(url)          ← url = url chương từ toc.js
  └─ trả về htmlString          ← Trả về HTML string trực tiếp, KHÔNG phải object
```

### Luồng Search

```
search.js → execute(key, page="")
  └─ trả về [{name, link, cover, description, host}], next
       └─ search.js → execute(key, page=next)  ← lặp đến next=null
```

---

## Script Contracts

| Script | Signature | Input | Returns |
|--------|-----------|-------|---------|
| `home` | `execute()` | — | `[{title, input, script}]` |
| `genre` | `execute()` | — | `[{title, input, script}]` |
| `gen` | `execute(url, page)` | url từ home/genre, page từ next | `[{name*, link*, cover?, description?, host?}], next?` |
| `search` | `execute(key, page)` | key = từ khóa, page từ next | `[{name*, link*, cover?, description?, host?}], next?` |
| `detail` | `execute(url)` | url trang truyện (bỏ / cuối) | `{name*, cover, host, author, description, detail, ongoing*, genres?, suggests?, comments?}` |
| `page` | `execute(url)` | url của detail | `[urlString, ...]` — luôn trả về mảng |
| `toc` | `execute(url)` | url từng item trong mảng page.js | `[{name*, url*, host?}]` |
| `chap` | `execute(url)` | url chương từ toc.js | `htmlString` |
| `comment` | `execute(input, next)` | từ comments trong detail | `[{name, content, description}], next?` |

**next** luôn phải là **string** hoặc **null** — KHÔNG được là number.

---

## page.js ← QUY TẮC QUAN TRỌNG

`page.js` là **bắt buộc** và là **trung gian** giữa detail và toc.

- **Nếu trang KHÔNG phân trang mục lục** → trả về mảng 1 phần tử là chính url detail:
  ```js
  return Response.success([url]);
  ```
- **Nếu trang CÓ phân trang** → trả về mảng các URL từng trang mục lục
- App sẽ gọi `toc.js` lần lượt với từng item trong mảng

```js
// page.js — không có phân trang
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    // Mục lục nằm ngay trên trang detail → trả về [url] để toc.js tự parse
    return Response.success([url]);
}

// page.js — CÓ phân trang (ví dụ: page/1, page/2, ...)
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);
    let doc = response.html();

    let pages = [];
    // TODO: tìm số trang mục lục
    doc.select(".pagination a, .page-list a").forEach(function(el) {
        let href = el.attr("href") + "";
        if (href && !href.includes("#")) {
            if (!href.startsWith("http")) href = BASE_URL + href;
            pages.push(href);
        }
    });

    // Fallback: không tìm thấy phân trang → trả về [url]
    if (pages.length === 0) return Response.success([url]);
    return Response.success(pages);
}
```

---

## home.js
```js
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/danh-sach/trang/{{page}}", script: "gen.js" },
        { title: "Hot", input: BASE_URL + "/truyen-hot/trang/{{page}}", script: "gen.js" },
        { title: "Hoàn thành", input: BASE_URL + "/hoan-thanh/trang/{{page}}", script: "gen.js" },
        { title: "Thể loại", input: BASE_URL + "/the-loai", script: "genre.js" }
    ]);
}
```

> Dùng `{{page}}` trong `input` để app tự inject số trang.

---

## genre.js
```js
function execute() {
    let response = fetch(BASE_URL + "/the-loai");
    if (!response.ok) return Response.error("Cannot load genres");

    let doc = response.html();
    const genres = [];

    doc.select(".genre-list a, .list-genres a").forEach(function(el) {
        let title = el.text() + "";
        let href = el.attr("href") + "";
        if (title && href) {
            if (!href.startsWith("http")) href = BASE_URL + href;
            genres.push({
                title: title,
                input: href,
                script: "gen.js"
            });
        }
    });

    return Response.success(genres);
}
```

---

## gen.js
```js
function execute(url, page) {
    if (!page) page = "1";

    // TODO: Điều chỉnh pattern phân trang theo từng site
    let pageUrl = url.replace("{{page}}", page);

    let response = fetch(pageUrl);
    if (!response.ok) return Response.error("Error: " + response.status);

    let doc = response.html();
    const data = [];

    // TODO: Cập nhật selector theo site thực tế
    doc.select(".book-list .item").forEach(function(el) {
        let name = el.select(".title a").text() + "";
        let link = el.select(".title a").attr("href") + "";
        let cover = el.select("img").attr("src") + "";
        let desc = el.select(".desc").text() + "";

        if (name && link) {
            if (!link.startsWith("http")) link = BASE_URL + link;
            if (cover.startsWith("//")) cover = "https:" + cover;
            data.push({
                name: name,
                link: link,
                cover: cover,
                description: desc,
                host: BASE_URL
            });
        }
    });

    let hasNext = doc.select("a.next, .pagination .next").size() > 0;
    let nextPage = (hasNext && data.length > 0) ? String(parseInt(page) + 1) : null;

    return Response.success(data, nextPage);
}
```

---

## search.js
```js
function execute(key, page) {
    if (!page) page = "1";

    // TODO: Cập nhật URL search theo site thực tế
    let response = fetch(BASE_URL + "/tim-kiem/", {
        queries: { tukhoa: key, page: page }
    });
    if (!response.ok) return Response.error("Search failed");

    let doc = response.html();
    const data = [];

    doc.select(".search-result .item").forEach(function(el) {
        let name = el.select(".title").text() + "";
        let link = el.select("a").attr("href") + "";
        let cover = el.select("img").attr("src") + "";
        let desc = el.select(".desc").text() + "";

        if (name && link) {
            if (!link.startsWith("http")) link = BASE_URL + link;
            data.push({
                name: name,
                link: link,
                cover: cover,
                description: desc,
                host: BASE_URL
            });
        }
    });

    return Response.success(data, data.length > 0 ? String(parseInt(page) + 1) : null);
}
```

---

## detail.js
```js
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);

    let doc = response.html();

    // TODO: Cập nhật selector theo site thực tế
    let name = doc.select("h1.title, .ten-truyen, h1.book-title").text() + "";
    let coverEl = doc.select(".cover img, .anh-bia img, .book-cover img").first();
    let cover = coverEl ? (coverEl.attr("src") + "") : "";

    let authorEl = doc.select(".author, .tac-gia, [itemprop=author]").first();
    let author = authorEl ? (authorEl.text() + "") : "";

    let statusEl = doc.select(".status, .trang-thai").first();
    let status = statusEl ? (statusEl.text() + "") : "";

    let descEl = doc.select(".description, .gioi-thieu, .novel-desc").first();
    let description = descEl ? (descEl.html() + "") : "";

    if (cover.startsWith("//")) cover = "https:" + cover;
    if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;

    let ongoing = !status.includes("Hoàn thành") && !status.includes("Completed") &&
                  !status.includes("Hoàn") && !status.includes("End");

    let detail = "Tác giả: " + author + "<br>Trạng thái: " + status;

    const genres = [];
    doc.select(".genre a, .the-loai a, .tags a").forEach(function(el) {
        let gTitle = el.text() + "";
        let gHref = el.attr("href") + "";
        if (gTitle && gHref) {
            if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
            genres.push({ title: gTitle, input: gHref, script: "gen.js" });
        }
    });

    const suggests = [];
    if (author) {
        suggests.push({ title: "Cùng tác giả: " + author, input: author, script: "search.js" });
    }

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres.length > 0 ? genres : undefined,
        suggests: suggests.length > 0 ? suggests : undefined
    });
}
```

---

## toc.js
```js
// toc.js nhận url từ page.js — mỗi call xử lý 1 trang mục lục
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);

    let doc = response.html();
    const chapters = [];

    // TODO: Cập nhật selector danh sách chương theo site thực tế
    doc.select(".chapter-list a, .danh-sach-chuong a, #list-chapter a").forEach(function(el) {
        let name = el.text() + "";
        let chapterUrl = el.attr("href") + "";

        if (name && chapterUrl) {
            if (!chapterUrl.startsWith("http")) {
                chapterUrl = chapterUrl.startsWith("/") ? BASE_URL + chapterUrl : BASE_URL + "/" + chapterUrl;
            }
            let isPaid = el.select(".vip, .paid, .lock").size() > 0;
            chapters.push({
                name: name,
                url: chapterUrl,
                host: BASE_URL,
                pay: isPaid || undefined
            });
        }
    });

    if (chapters.length === 0) {
        return Response.error("No chapters found");
    }

    return Response.success(chapters);
}
```

---

## chap.js
```js
// chap.js trả về HTML string trực tiếp — KHÔNG phải object!
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);

    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load: " + response.status);

    let doc = response.html();

    doc.select(".ads, .advertisement, script, style, noscript, .banner").remove();

    // TODO: Cập nhật selector nội dung chương theo site thực tế
    let content = doc.select("#chapter-content, .chapter-c, #content, .chapter-content").html() + "";

    if (!content || content === "null") return Response.error("No content found");

    content = content.replace(/&nbsp;/g, " ");
    content = content.replace(/\s+/g, " ");
    content = content.trim();

    return Response.success(content);
}
```

---

## config.js (Bắt buộc)
```js
let BASE_URL = "https://domain.net";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch(e) {}
```

---

## utils.js (Helper thường dùng)
```js
function normalizeUrl(url, base) {
    if (!url) return "";
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return base + url;
    if (!url.startsWith("http")) return base + "/" + url;
    return url;
}

function cleanText(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
```