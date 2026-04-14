# Agent Guide — VBook Extension

Tài liệu này dành cho agent và contributor khi viết/sửa extension ở phân vùng cá nhân của repo.

## 1. Workflow bắt buộc

`Research -> Implement -> Edit metadata -> Build -> Rebuild catalog`

- Research: kiểm tra DOM/XHR live site trước khi code.
- Implement: viết code trong `src/` theo contract của extension.
- Edit metadata: dùng `vbook ext --mode edit` để cập nhật `plugin.json`.
- Build: `npx vbook build --plugin <path>`.
- Rebuild catalog: `npx vbook build-catalog`.

Nếu ext không muốn public, đặt toàn bộ trong `.private/extensions/**` (thư mục này đã gitignored) và không đưa vào `extensions/**`.

## 2. Rhino contract

### Được dùng

- `var`, `function`, `if/else`, `for`, `while`, `try/catch`
- Regex, `JSON.parse/stringify`, `Array.forEach/map/filter`
- `load("utils.js")`

### Không dùng

- `import/export`
- `async/await`, `Promise`
- Optional chaining `?.`, nullish `??`
- Class syntax phức tạp không tương thích runtime

## 3. Script Contract

- `home.js` / `genre.js` -> `[{ title, input, script }]`
- `gen.js` / `search.js` -> `Response.success(list, next?)`
- `detail.js` -> object detail truyện
- `toc.js` -> danh sách chương
- `chap.js` -> nội dung chương (html string) hoặc list image cho comic

## 4. Metadata Contract

- `metadata.type`: `novel | comic | chinese_novel | translate | tts`
- `metadata.source`: URL gốc của nguồn
- `metadata.author`: giữ nguyên attribution tác giả
- `script` map đến tên file trong `src/`

## 5. Debug Checklist

- Lỗi parse HTML: kiểm tra selector đã đổi trên site.
- Lỗi page next: `next` nên trả về string.
- Lỗi runtime: đảm bảo có `execute` và không dùng syntax không hỗ trợ.
- Lỗi duplicate policy: tránh tạo extension trùng `source + author`.
- Lỗi package: chạy `vbook build` để kiểm tra `src/` + `icon.png` có đủ không.

## 6. Legal/Safety Rules

- Không đưa code copy blind từ repo ngoài.
- Không merge extension vi phạm policy nội bộ.
- Luôn review lại source và metadata trước khi commit.

## 7. Phân vùng repo

- `extensions/` và `tools/cli/` là phân vùng cá nhân.
- `.private/extensions/` là phân vùng cá nhân private, không lên catalog public.
- `ref/` và `web/` là phân vùng cộng đồng.
- Khi viết extension, chỉ quan tâm tới phân vùng cá nhân; catalog cộng đồng được xử lý bởi workflow riêng.

## 8. Đọc thêm

- `docs/CONTRIBUTING.md`
- `docs/DEPLOY_VERCEL_GITHUB.md`
- `docs/vbook_demo.md`
