# Reference Repos

## Khi nào dùng
Dùng khi cần tham khảo pattern lập trình extension cho site type cụ thể, KHÔNG copy blindly (copy chép code cứng nhắc).

## Danh sách
| Repository | Tập trung / Site Type | Link |
|---|---|---|
| **darkrai9x-vbook-extensions** | General (Novel, Comic base lớn) | [Darkrai9x](https://github.com/Darkrai9x/vbook-extensions) |
| **dat-bi-ext-vbook** | Novel, Boilerplate pattern | [dat-bi](https://github.com/dat-bi/ext-vbook) |
| **dat-bi-vbook-ext** | Scripts Tooling | [dat-bi-vbook-ext](https://github.com/dat-bi/vbook-ext) |
| b3x0m-vbook-ext | Novel, Comic, 18+ | b3x0m-vbook-ext |
| banquyy-vbook | Chinese Novel (TTV, ddxs, ttkan) | banquyy-vbook |
| baobao666888-ext-vbook-w | Truyện dịch, Comic đa dạng | baobao-ext |
| chanhnh-vbook-ext | Truyện TTV / FQWeb | chanhnh-vbook |
| laofun-vbook-extensions | Extension đi kèm bộ lọc nâng cao | laofun |
| Các maintainers khác | Đa dạng tiểu thuyết cơ bản | (alexsonxxx, duongden, khoa301020, vv) |

## Rules khi dùng references
- **Verify lại với live site** (HTML/XHR): Structure DOM của target server được update hàng tháng, do đó selector trong các repositories này có khả năng lỗi thời. Regex và Selectors cần review trước.
- **Non-negotiables của project luôn override references**: Repositories ngoài có quyền viết lỏng lẻo, nhưng ở codebase này, rules trong `AI_CODE_EXT_VBOOK.md` luôn có mức ưu tiên cao nhất.
- **Tuân thủ RHINO Restrictions**: Copy paste JS snippets từ cộng đồng có thể kẹp ES6 advanced (e.g., async/await, optional chaining). Bạn bắt buộc refactor lại tất cả các snippet tương thích với `Rhino 1.7.14`.
- **Merge Logic Utils**: Khi copy extraction function, nếu `gen.js` và `search.js` giống hệt nhau, chia function parse item HTML dùng chung ra file `load("utils.js")` thay vì copy rời rạc.
