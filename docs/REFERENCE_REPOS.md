# Reference Repos

## Khi nào dùng
Dùng khi cần tham khảo pattern lập trình extension cho site type cụ thể, KHÔNG copy blindly (copy chép code cứng nhắc).

## Danh sách
| Repository | Tập trung / Site Type | Link |
|---|---|---|
| **darkrai9x-vbook-extensions** | General (Novel, Comic base lớn) | [Darkrai9x](https://github.com/Darkrai9x/vbook-extensions) |
| **dat-bi-ext-vbook** | Novel, Boilerplate pattern | [dat-bi](https://github.com/dat-bi/ext-vbook) |
| **dat-bi-vbook-ext** | Scripts Tooling | [dat-bi/vbook-ext](https://github.com/dat-bi/vbook-ext) |
| b3x0m-vbook-ext | Đa dạng (520danmei, xbanxia, truyenlh) / Novel, Comic, 18+ | b3x0m/vbook-ext |
| banquyy-vbook | Nguồn tiếng Trung (ddxsfix, ttkan) / Chinese Novel | banquyy/vbook |
| baobao666888-ext-vbook-w | Bộ sưu tập rộng (ixdzs, ungtycomics) / Truyện web, Comic | baobao666888/ext-vbook-w |
| chanhnh-vbook-ext | Chuyên trang / Fanqie (fqweb), TTV | chanhnh/vbook-ext |
| laofun-vbook-extensions | Extensions kèm bộ lọc (filtering) / Novel | laofun/vbook-extensions-with-filter |
| alexsonxxx-vbook | Biến thể cộng đồng / General Novel | alexsonxxx/vbook |
| duongden-vbook | Cộng đồng chia sẻ / General Novel | duongden/vbook |
| evamirion-vbook-ext | Cộng đồng chia sẻ / General Novel | evamirion/vbook-ext |
| hajljnopera-vbook-ext | Cộng đồng chia sẻ / General Novel | hajljnopera/vbook-ext |
| hienpro00123-vbook_meou | Biến thể custom / General Novel | hienpro00123/vbook_meou |
| hieu45666-vbook_ext | Cộng đồng chia sẻ / General Novel | hieu45666/vbook_ext |
| hishirooo-vbook-ext | Cộng đồng chia sẻ / General Novel | hishirooo/vbook-ext |
| khoa301020-vbook-ext | Cộng đồng chia sẻ / General Novel | khoa301020/vbook-ext |
| lethituyen-vbooks-extension | Thư viện extension cộng đồng / General Novel | lethituyen/vbooks-extension |
| mizhm-vbook-extensions | Cộng đồng chia sẻ / General Novel | mizhm/vbook-extensions |
| moleys-vbook-ext | Cộng đồng chia sẻ / General Novel | moleys/vbook-ext |
| seyah24-vbook-exts | Cộng đồng chia sẻ / General Novel | seyah24/vbook-exts |
| sonzin-vbook-extension | Cộng đồng chia sẻ / General Novel | sonzin/vbook-extension |
| springpeachvinh-vbook-ext | Cộng đồng chia sẻ / General Novel | springpeachvinh/vbook-ext |
| tamchau-vbook-extensions | Cộng đồng chia sẻ / General Novel | tamchau/vbook-extensions |
| tuanhai03-vbook-extensions | Cộng đồng chia sẻ / General Novel | tuanhai03/vbook-extensions |
| **SoulGodEve9x9-vbook-ext** | Nahona extensions / Comic, Novel, Chinese Novel | [SoulGodEve9x9](https://github.com/SoulGodEve9x9/Vbook-ext/tree/Nahona) |
| **hieunm3103-vbook-extension** | Cosplay, Photo galleries / Comic, Novel, Chinese Novel | [hieunm3103](https://gitlab.com/hieunm3103/vbook-extension) |
| **longvuu-ext** | Chinese novels, General Novel / Novel, Comic, Chinese Novel | [longvuu](https://github.com/longvuu/ext) |
| **gh369-639-vbook-ext-public** | 3690 extensions / Translate, Novel, Comic, Chinese Novel | [gh369-639](https://github.com/gh369-639/vbook-ext-public) |
| **kur21-vbook-ext** | Kou extensions / Comic (NSFW) | [kur21](https://github.com/kur21/vbook-ext) |
| **Gold2k2k2k-HTri-Vbook-Ext** | Hữu Trí extensions / Novel | [Gold2k2k2k](https://github.com/Gold2k2k2k/HTri-Vbook-Ext) |

## Rules khi dùng references
- **Verify lại với live site** (HTML/XHR): Structure DOM của target server được update hàng tháng, do đó selector trong các repositories này có khả năng lỗi thời. Regex và Selectors cần review trước.
- **Non-negotiables của project luôn override references**: Repositories ngoài có quyền viết lỏng lẻo, nhưng ở codebase này, rules trong `AI_CODE_EXT_VBOOK.md` luôn có mức ưu tiên cao nhất.
- **Tuân thủ RHINO Restrictions**: Copy paste JS snippets từ cộng đồng có thể kẹp ES6 advanced (e.g., async/await, optional chaining). Bạn bắt buộc refactor lại tất cả các snippet tương thích với `Rhino 1.7.14`.
- **Merge Logic Utils**: Khi copy extraction function, nếu `gen.js` và `search.js` giống hệt nhau, chia function parse item HTML dùng chung ra file `load("utils.js")` thay vì copy rời rạc.

## Dedup Priority cho Mass Migration

Khi chạy `vbook inventory` để hợp nhất hàng loạt, rule chọn extension giữ lại được áp dụng theo thứ tự:

1. `metadata.source` cùng domain sẽ được gom cùng một nhóm dedupe.
2. Ưu tiên bản có `metadata.version` cao hơn.
3. Nếu bằng version, ưu tiên trust repo theo thứ tự:
	- `extensions/` (local curated)
	- `darkrai9x-vbook-extensions`
	- `dat-bi-ext-vbook`
	- các repo còn lại
4. Nếu vẫn bằng nhau, dùng lexical path để đảm bảo kết quả deterministic.

Lưu ý:
- `vbook sort` giữ nguyên `metadata.author`, không rewrite tên tác giả.
- Nếu đích `extensions/{type}/{folder}` đã tồn tại thì command sẽ skip, không ghi đè.
