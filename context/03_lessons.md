# 03_lessons.md — Lessons Learned

> Real mistakes and fixes from extension development. Read before starting any new extension.

---

## 1. Icon Verification — ALWAYS Check After Scaffold

**Problem:** Scaffold downloads favicon automatically. If the site uses SVG, redirects, or returns HTML → `icon.png` = corrupted.

**Rule:** After scaffold, verify `icon.png` is a valid image:
- View file visually (binary check)
- If HTML/text → manually download the correct logo as PNG (64x64px)

---

## 2. Regexp Must Be Complete and Strict

**Problem:** Simple regex misses protocol/www or doesn't anchor properly.

**Correct pattern:**
```
https?:\/\/(?:www\.)?domain\.net\/truyen\/[a-zA-Z0-9-]+\/?$
```

**Rules:**
- MUST start with `https?:\/\/`
- MUST include `(?:www\.)?`
- MUST end with `\/?$` (detail page ONLY)
- Use `[a-zA-Z0-9-]+` for slugs, NOT `[^/]+`

---

## 3. page.js + toc.js Integration (API-based TOC)

**Problem:** `page.js` returns an array of pagination URLs (or IDs). `toc.js` is called with each input from that array. A common mistake is trying to fetch the detail page inside `toc.js` even when it was called with an API URL.

**Solution:**
1. `page.js` → returns an array of API URLs or IDs.
2. `toc.js` must handle both:
   - Called with detail URL → parse IDs from the page, then fetch API.
   - Called with API URL directly → extract params and return data.

---

## 4. Pagination Detection

**Problem:** Extending TOC for novels with many chapters needs pagination. Some sites don't show page count upfront or hide it behind JS.

**Solution:** 
- Use `mcp_vbook_inspect` to check for pagination elements.
- Look for common markers like `.pagination`, `a.next`, or "Page X of Y".
- If hidden by JS, use `Engine.newBrowser()` in `page.js`.

---

## 5. AJAX/POST Requests

**Problem:** Some AJAX endpoints return 403 or empty data without specific headers.

**Solution:**
- Always check `mcp_vbook_analyze` for XHR calls and their headers.
- Common mandatory headers: `Content-Type: application/x-www-form-urlencoded`, `X-Requested-With: XMLHttpRequest`.

---

## 6. Chapter Sorting

**Problem:** Chapters may come unsorted from certain APIs (e.g., from oldest to newest or vice versa, or random).

**Solution:** Use a numeric sort based on extracted chapter numbers if necessary.

---

## 7. Standardizing List Item Selection

**Problem:** 
Using generic selectors like `article` or `div` can lead to the "1-item bug" where the main container is selected instead of individual list items.

**Solution:**
1. **Be Specific:** Always use list-item specific classes found via `mcp_vbook_inspect` (e.g., `.item`, `.story-card`).
2. **Handle Link Elements Robustly:** Check if the container itself is an `<a>` or contains one.
   ```javascript
   var selfHref = el.attr('href') + "";
   var linkEl = (selfHref && selfHref.indexOf('http') > -1) ? el : el.select('a').first();
   ```
3. **Selector Coverage:** If a site has multiple layouts (grid/list), merge the selectors:
   `doc.select('SELECTOR_GRID_ITEM, SELECTOR_LIST_ITEM')`

---

## 8. Null Safety (Rhino Serialization)

**Problem:** Calling `.text()`, `.attr()`, or `.html()` on Jsoup elements returns Java objects that may crash the serialization when passed to `Response.success`.

**Rule:** **ALWAYS** append `+ ""` to convert them to JS strings.
```javascript
var title = el.select("SELECTOR").text() + "";
```

---

## TruyenDich.AI TOC pagination now derives from chapter ranges

**Problem:** `page.js` cũ dựa vào link `a[title=Trang cuối]`/`trang-*`, nhưng HTML mới không còn link pagination dạng anchor mà chuyển sang dải button `1 - 200`, `201 - 400`, ... nên chỉ trả 1 trang và khiến TOC thiếu chương.

**Solution:** Ở `page.js`, parse section `Danh sách chương`, lấy tổng chương từ badge/range button, lấy page size từ số chapter link đang render (thực tế là 50), rồi tính `totalPages = ceil(totalChapters / pageSize)` để tạo danh sách `/trang-N`. Đồng thời cập nhật `toc.js` để parse trong block `Danh sách chương` và ghép tên chương + phụ đề từ 2 span.