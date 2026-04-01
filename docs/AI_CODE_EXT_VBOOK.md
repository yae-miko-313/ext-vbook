# Agent Guide — VBook Extension

Tài liệu này dành cho agent và contributor khi viết/sửa extension.

## 1. Workflow bắt buộc

`Research -> Implement -> Lint -> Fix -> Verify -> Build`

- Research: kiểm tra DOM/XHR live site trước khi code.
- Implement: tất cả script bắt đầu bằng `function execute(...)`.
- Lint: `npx vbook lint --plugin <path>`.
- Fix: `npx vbook fix --plugin <path> --write`.
- Verify: `npx vbook verify --mode offline --plugin <path>`.
- Build: `npx vbook build --plugin <path>`.

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

## 6. Legal/Safety Rules

- Không đưa code copy blind từ repo ngoài.
- Không merge extension vi phạm policy nội bộ.
- Luôn review lại source và metadata trước khi commit.

## 7. Đọc thêm

- `docs/REFERENCE_REPOS.md`
- `docs/CONTRIBUTING.md`
- `docs/vbook_demo.md`
