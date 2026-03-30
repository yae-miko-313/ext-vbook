# AI Agent Guide — VBook Extension

## 1. WORKFLOW (bắt buộc đọc trước)
`Nhận task` → `Research site` → `Implement` → `Lint` → `Fix` → `Verify` → `Build`

- **Research site**: Xem HTML cấu trúc DOM của web (dùng DOM inspector). Lưu ý endpoint API Next.js ẩn.
- **Implement**: CODE TẠO FILES chuẩn. Tuân thủ bảng RHINO CONSTRAINTS. Mọi logic bắt đầu từ `function execute(...)`.
- **Lint**: Chạy `npx vbook lint --plugin extensions/[tên]`. Check warning rule. KHÔNG được bỏ qua báo lỗi Error.
- **Fix**: Sử dụng `npx vbook fix --plugin extensions/[tên] --write` format/clean metadata.
- **Verify**: `npx vbook verify --mode offline --plugin [tên]`. Các tệp script bắt buộc phải hợp lệ, có icon PNG chuẩn. Điều kiện đi tiếp: PASS 100%. (Khuyến khích test thêm bằng `test-all` / `debug` nếu cần xác thực logic JS HTTP).
- **Build**: Export kết quả bằng `npx vbook build`.

## 2. RHINO CONSTRAINTS (không được vi phạm)
| SUPPORTED | UNSUPPORTED |
|---|---|
| `let`, `const`, `var` | KHÔNG DÙNG Optional chaining `?.` và Nullish `??` (thay = `&&`) |
| Arrow functions `() =>`, Generator `function*` | KHÔNG DÙNG Default params (VD `f(a=1)` -> thay `a=a===undefined?1:a`) |
| `{a,b}` destructuring, `[key]` obj keys | KHÔNG DÙNG rest array: `[a, ...rest]` |
| `` template ${literals} `` | KHÔNG DÙNG `String.matchAll` (thay bằng regex `exec()` trong list) |
| `class`, `Map`, `Set`, `Symbol` | KHÔNG DÙNG `async / await` (Phải dùng Sync Requests, `sleep()`) |
| Built-in method module `load("utils.js")` | KHÔNG DÙNG `import / export` |
| Rest parameters trong khai báo hàm (`...args`) | KHÔNG DÙNG spread lúc xử lý `Math.max(...a)` `[...arr]` (thay `.apply`) |

## 3. SCRIPT CONTRACTS
- **`home()`**           → `[{title, input, script}]`
- **`genre()`**          → `[{title, input, script}]`
- **`gen(url, page)`**   → `[{name*, link*, cover?, description?, host?}]`, `nextPage?`
- **`search(key,page)`** → `[{name*, link*, cover?, description?, host?}]`, `nextPage?`
- **`detail(url)`**      → `{name*, cover, host, author, description, detail, ongoing:bool*, genres?:[...], suggests?:[...], comments?:[...]}`
- **`page(url)`**        → `[urlString, ...]`
- **`toc(url)`**         → `[{name*, url*, host?}]`
- **`chap(url)`**        → `htmlString`
- **`comment(input,next)`** → `[{name, content, description}]`, `nextCursor?`

*(Các field `*` là bắt buộc. Điểm bắt đầu luôn tên là `function execute(...)` ở tất cả module)*

## 4. RETURN API + HTTP API + DOM API

**Return API:**
```javascript
Response.success(data)
Response.success(data, next) // next MUST BE STRING. E.g: String(parseInt(page)+1)
Response.error("Message string")
```

**HTTP API:**
```javascript
let res = fetch(url, { method: "POST", headers: {...}, body: "..."});
res.ok; res.status; res.html("gbk"); res.text(); res.json(); res.base64();
// Advanced wrapper
Http.get(url).headers({}).queries({}).html();
Http.post(url).body("raw").string();
```

**DOM (Jsoup) API:**
```javascript
let doc = Html.parse(str);
let elems = doc.select("a[href], div.test:contains(abc), h1 + p");
elems.first().text(); elems.last().attr("href"); elems.size();
elems.forEach(el => {}); // Luôn dùng forEach để tránh lỗi .map native nếu list jsoup 
```

**Browser API:** (Cho sites JS bảo vệ)
```javascript
var b = Engine.newBrowser();
b.launch(url, timeoutMs); 
b.waitUrl(["regex.."], ms);
b.block(["ads.com", "tracker.js"]); // Tối ưu mobile
let h = b.html(); 
b.close(); // Quan trọng: Luôn gọi close() để tránh memory leak
```

## 5. COMMON ERRORS → FIX
| Error message | Nguyên nhân | Fix |
|---|---|---|
| `ReferenceError: server is not defined` | Lỗi scope variable | Khai báo `let server = null;` bên ngoài catch / wrap chuẩn. |
| `data2: "NaN"` | Trả về Type error ở biến phân trang `next` | `String(parseInt(page)+1)`. Tham số `next` bắt buộc `String`. |
| `ClassCastException: UniqueTag cannot be cast` | Đặt sai tên Main Function Javascript | Tại file js luông viết hàm `function execute(...)`.  |
| `TypeError: className is not a function` | Rhinos Jsoup wrapper ko nhận property class DOM | Luôn sử dụng `el.attr("class")`. Truy cập Attribute luôn qua `attr` |
| Quá nhiều chapters TOC (Gấp đôi) | Script `toc.js` loop request | Bỏ các sub tab "new chapter" bằng class DOM strict: `.list-chapter` |

## 6. PLUGIN.JSON RULES
1. **`regexp`**: Khớp regex chuẩn có anchor `$`. Ví dụ URL truyện: `example\.com/book/[^/]+/?$`.
2. **`script`**: Value đường dẫn file bắt buộc LÀ TÊN BẢN THÂN FILENAME DUY NHẤT (VD: `"detail": "detail.js"`), loại trừ prefix `src/`.
3. **`author`**: Đọc environment fallback `"author": "kychi"` hoặc theo `VBOOK_AUTHOR`.
4. Mọi extension version phải > 0 và đồng bộ `version` (int). Numeric strings (e.g. `"1"`) tự fix = CLI.

### Root manifest rule (critical)
- `plugin.json` ở root là manifest cá nhân, schema là:
	- `{ "metadata": {...}, "data": [...] }`
- Không được ghi đè root `plugin.json` theo schema catalog của `extensions/plugin.json`.
- `build-catalog` chỉ dành cho `extensions/plugin.json`, `extensions/{type}/plugin.json`, `extensions/catalogs/*.plugin.json`.
- Khi cập nhật root manifest, chỉ sửa thủ công theo format cá nhân, không sync tự động từ catalog community.

### Grouped catalog path rule (critical)
- `extensions/catalogs/*.plugin.json` hiện dùng `path` trỏ tới `plugin.zip` cho từng extension leaf.
- Khi đổi hoặc sync grouped catalogs, phải đảm bảo `extensions/{type}/{name}/plugin.zip` tồn tại tương ứng.
- Nếu thiếu zip: chạy `npx vbook build --plugin extensions/{type}/{name}` hoặc build hàng loạt trước commit/push.

## 7. SELF-EVOLUTION
- Hợp nhất code: Tìm regex chung để nén nhiều `gen.js` và `search.js` gọi hàm của file chung qua `load("utils.js")`.
- Giải quyết String Obfuscation: Viết `cleanContent` custom filter HTML/unicode.
- Tự thích nghi: Phải check Request Network F12 hoặc API Next.js ẩn thay vì cào Jsoup html cứng nhắc.

## 8. LEGAL EXCLUSION POLICY (BẮT BUỘC)
- Không làm extension cho website có dấu hiệu bản quyền/đăng ký pháp lý tại VN, ví dụ:
	- Có mã số thuế doanh nghiệp/cá nhân.
	- Có thông tin đăng ký hoặc xác thực Bộ Công Thương.
	- Có cảnh báo sở hữu bản quyền nội dung rõ ràng và đang vận hành thương mại.
- Khi phát hiện các dấu hiệu trên: dừng implement, không merge, báo lại maintainer để loại khỏi catalog.
- Rule này ưu tiên an toàn pháp lý và phải áp dụng nhất quán để giảm rủi ro.

> Reference repos: xem REFERENCE_REPOS.md
