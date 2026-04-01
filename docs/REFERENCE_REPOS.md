# Reference Repos

Tài liệu này là danh sách repo tham khảo để học pattern.
Không copy blind, luôn verify lại với live site.

## Core Trusted Sources

| Source | Focus | Link |
|---|---|---|
| darkrai9x-vbook-extensions | General novel/comic | https://github.com/Darkrai9x/vbook-extensions |
| dat-bi-ext-vbook | Boilerplate, novel | https://github.com/dat-bi/ext-vbook |
| baobao666888-ext-vbook-w | Large mixed set | https://github.com/baobao666888/ext-vbook-w |
| SoulGodEve9x9-vbook-ext | Nahona branch | https://github.com/SoulGodEve9x9/Vbook-ext/tree/Nahona |
| gh369-639-vbook-ext-public | 3690 set | https://github.com/gh369-639/vbook-ext-public |
| longvuu-ext | Chinese + general | https://github.com/longvuu/ext |

## Community Sources (Shortlist)

- https://github.com/chanhnh/vbook-ext
- https://github.com/tuanhai03/vbook-extensions
- https://github.com/mizhm/vbook-extensions
- https://github.com/moleys/vbook-ext
- https://github.com/springpeachvinh/vbook-ext
- https://github.com/tamchau/vbook-extensions

## Quy tắc khi tham khảo

1. Verify DOM/XHR trên site thực tế trước khi tái sử dụng selector.
2. Rules trong `docs/AI_CODE_EXT_VBOOK.md` luôn ưu tiên cao nhất.
3. Refactor về syntax tương thích Rhino nếu gặp snippet không tương thích.
4. Nếu `gen.js` và `search.js` trùng logic, tách function chung sang `utils.js`.

## Dedup Priority (Mass Migration)

1. Key dedupe: `domain(source) + author`.
2. Cùng domain khác author được phép cùng tồn tại.
3. Trong cùng key: version cao hơn được ưu tiên.
4. Nếu bằng version: trust order
   - `extensions/`
   - darkrai9x-vbook-extensions
   - dat-bi-ext-vbook
   - các nguồn còn lại
5. Nếu vẫn bằng nhau: lexical path để deterministic.
