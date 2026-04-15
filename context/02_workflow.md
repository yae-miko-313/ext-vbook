# 02_workflow.md — AI Development SOP

> Standard workflow for creating and maintaining VBook extensions.

## Development Workflow

### Creating NEW Extension (8 Steps)

0. **QUESTIONNAIRE** — AI PHẢI HỎI user trước khi làm gì khác:

```
Để tạo extension, mình cần bạn trả lời:

1. Loại? [A] Novel  [B] Comic  [C] Chinese novel  [D] Translate  [E] TTS
2. Tag? [A] Thường  [B] 18+
3. Link trang DANH SÁCH truyện (home/gen):
4. Link trang CHI TIẾT một truyện bất kỳ:
5. Link trang MỤC LỤC chương:
6. Link trang ĐỌC CHƯƠNG:
7. Có search? [A] Có  [B] Không
8. Có genres/thể loại? [A] Có  [B] Không
```

**CHỈ SAU KHI có đủ answers mới tiếp tục bước 1.**

> ℹ️ Không cần hỏi về phân trang mục lục. `page.js` luôn được tạo mặc định.
> Nếu mục lục không phân trang → page.js chỉ trả về `[url]`.

---

1. **Inspect Website** — TRƯỚC KHI scaffold, inspect TẤT CẢ các URL user cung cấp:
   ```
   mcp_vbook_inspect(url_danh_sach)  → selectors: list item, title, link, cover
   mcp_vbook_inspect(url_chi_tiet)   → selectors: name, author, cover, status, description, genres
   mcp_vbook_inspect(url_muc_luc)    → selectors: chapter links, pagination (có hay không?)
   mcp_vbook_inspect(url_doc_chuong) → selectors: chapter content
   ```
   **Ghi nhận kết quả. KHÔNG viết code trước bước này.**

2. **Scaffold**
   ```bash
   vbook create "<name>" --source "<url>" --type <novel|comic|chinese_novel>
   ```
   **⚠️ POST-SCAFFOLD CHECK**: Verify `icon.png` is valid image (not HTML/text).

3. **Implement với selectors THỰC TẾ**
   - Dùng kết quả từ Bước 1 để điền vào `src/*.js`
   - **NGHIÊM CẤM** dùng generic placeholders: `.book-item`, `.story-item`, `h3 a`, `.title a`, `#content`
   - **CRITICAL**: No async/await, no `?.`, no `??`, no spread
   - **page.js RULE**: LUÔN tạo `page.js`. Nếu site không phân trang mục lục → `return Response.success([url])`. Nếu có phân trang → trả về mảng URL từng trang. `toc.js` nhận lần lượt từng URL từ mảng này.

4. **Static Check**
   ```bash
   vbook validate ./<name>
   ```

5. **Individual Testing**
   ```bash
   vbook debug src/detail.js -in "<url_to_book>"
   vbook debug src/chap.js -in "<url_to_chapter>"
   ```

6. **Full Flow Verification**
   ```bash
   vbook test-all
   ```
   **⚠️ WARNING**: After test-all passes, you MUST also:
   - Test search.js: `vbook debug src/search.js -in "keyword"`
   - Test genre.js: `vbook debug src/genre.js`
   - Verify icon.png visually
   - Test with REAL URL from website

7. **Package & Publish**
   ```bash
   vbook publish
   ```

---

### Repair/Edit Extension (6 Steps)

1. **Locate & Analyze**
   - Read failing extension's `src/*.js` and `plugin.json`

2. **Verify Status**
   - Use browser to check if site structure changed
   - Run `vbook debug` to see exact error

3. **Fix Code & Config**
   - Update selectors/parsing in `src/`
   - If domain changed, update `metadata.source` and `metadata.regexp`

4. **Validate & Local Test**
   - `vbook validate`
   - `vbook debug` again

5. **Bump Version & Build**
   ```bash
   vbook build --bump
   ```

6. **Update Registry**
   ```bash
   vbook publish
   ```

---

### Autonomous Maintenance (Auto-Fix)

When asked to fix without explicit confirmation:

1. Read `vbook-tool/.env` → get VBOOK_IP
2. Reproduce: `vbook debug src/detail.js -in "<failing_url>"`
3. Fix code → `vbook validate`
4. Verify: `vbook debug` again
5. If OK: `vbook test-all`
6. Bump & Publish: `vbook build --bump && vbook publish`
7. Report new version

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `ReferenceError: server is not defined` | Declare `server` with `let` outside try block |
| `data: "NaN"` in next param | Use `String(parseInt(page || '1') + 1)` |
| `gen.js` returned no data | Check if home uses different selectors. Prefer dedicated list URLs |
| `ClassCastException` | Main function MUST be `execute()`, not `home()`, `gen()`, etc. |
| Character obfuscation | Use cleanContent helper with Regex |
| Redirects in search | Detect: `if (doc.select("h1, .entry-title").size() > 0)` |

---

## Best Practices

### config.js Pattern
```js
let BASE_URL = "https://...";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch(e) {}
```

### URL Normalization
```js
url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
```

### Regexp in plugin.json
MUST match detail page URL only:
```
"https?:\\/\\/(?:www\\\\.)?domain\\\\.net\\/truyen\\/[a-zA-Z0-9-]+\\/?$"
```

### Internal API Discovery (Priority)
ALWAYS check `/api/` routes before using Browser:
```js
// Try these first:
BASE_URL + "/api/novels/slug/<slug>"
BASE_URL + "/api/novels/<id>"
BASE_URL + "/api/novels/search?title=<key>"
```

### Home Tab Pagination
Use `{{page}}` template:
```js
{ title: "Mới cập nhật", input: BASE_URL + "/trang/{{page}}", script: "gen.js" }
```

### Genres as Objects
```js
genres: novel.genres.map(genre => ({
    title: genre,
    input: BASE_URL + "/danh-sach-truyen?genre=" + encodeURIComponent(genre),
    script: "gen.js"
}))
```

### VIP Chapters
```js
chapList.push({ name: "...", url: "...", pay: true/false, host: BASE_URL });
```

### page.js — Quy tắc mặc định

`page.js` là **bắt buộc**. Nhận `url` từ detail, trả về mảng các URL cho `toc.js`.

```js
// Không có phân trang:
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    return Response.success([url]);  // toc.js sẽ nhận chính url này
}

// Có phân trang:
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    let response = fetch(url);
    if (!response.ok) return Response.error("Cannot load");
    let doc = response.html();
    let pages = [];
    doc.select(".pagination a").forEach(function(el) {
        let href = el.attr("href") + "";
        if (href && !href.includes("#")) {
            if (!href.startsWith("http")) href = BASE_URL + href;
            pages.push(href);
        }
    });
    if (pages.length === 0) return Response.success([url]);
    return Response.success(pages);
}
```