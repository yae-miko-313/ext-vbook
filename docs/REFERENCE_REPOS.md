# Reference Repos

Tài liệu này là danh sách nguồn tham chiếu đầy đủ để sync metadata.
Không copy blind, luôn verify lại với live site.

## Danh sách nguồn cập nhật (raw URL)

1. https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/plugin.json
2. https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/chinese_plugin.json
3. https://raw.githubusercontent.com/lethituyen/vbooks-extension/refs/heads/master/plugin.json
4. https://raw.githubusercontent.com/Moleys/vbook-ext/main/plugin.json
5. https://raw.githubusercontent.com/dat-bi/ext-vbook/main/plugin.json
6. https://raw.githubusercontent.com/SoulGodEve9x9/Vbook-ext/Nahona/plugin.json
7. https://gitlab.com/hieunm3103/vbook-extension/-/raw/main/plugin.json
8. https://raw.githubusercontent.com/BaoBao666888/ext-vbook-w/main/plugin.json
9. https://raw.githubusercontent.com/duongden/vbook/refs/heads/main/plugin.json
10. https://raw.githubusercontent.com/longvuu/ext/refs/heads/master/plugin.json
11. https://raw.githubusercontent.com/TuanHai03/vbook-extensions/refs/heads/main/plugin.json
12. https://raw.githubusercontent.com/WillSun28/vbook-extensions/refs/heads/main/plugin.json
13. https://raw.githubusercontent.com/gh369-639/vbook-ext-public/refs/heads/main/plugin.json
14. https://raw.githubusercontent.com/mizhm/vbook-extensions/refs/heads/main/plugin.json
15. https://raw.githubusercontent.com/kur21/vbook-ext/refs/heads/main/plugin.json
16. https://raw.githubusercontent.com/sonzin/vbook-extension/refs/heads/main/plugin.json
17. https://raw.githubusercontent.com/alexsonxxx/vbook/refs/heads/main/plugin.json
18. https://raw.githubusercontent.com/kychitoge/vbook-ext/main/plugin.json
19. https://raw.githubusercontent.com/Gold2k2k2k/HTri-Vbook-Ext/refs/heads/main/plugin.json
20. https://raw.githubusercontent.com/Evamirion/vbook-ext/main/plugin.json
21. https://raw.githubusercontent.com/hienpro00123/vbook_MeoU/refs/heads/main/plugin.json
22. https://raw.githubusercontent.com/hieu45666/vbook_ext/main/plugin.json
23. https://raw.githubusercontent.com/hishirooo/vbook-ext/master/plugin.json
24. https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/translate.json
25. https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/tts.json

## Danh sách ext hiện có

- https://xn--ngc-bmz.vn/i/vbook/extension_list.php#id-22

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
