# Reference Repos

Tài liệu này là danh sách nguồn tham chiếu đầy đủ để sync metadata.
Không copy blind, luôn verify lại với live site.

## Ghi chú kiến trúc mới

1. **`extensions/`**: Chỉ chứa ext riêng của maintainer (personal extensions)
   - Build thành `.zip` qua CLI
  - Không tham gia vào `web/plugin.json`

2. **`code-reference/`**: Fork/sample từ external repos (học tập, không dùng direct)
   - Organized by type (novel, comic, translate, tts)
   - Read-only, không embed vào catalog

3. **`ref/monitor.json`**: Aggregate snapshot của external sources
   - Định kỳ sync từ provider các repos
   - Chứa `sources[]` list + nested `content.data[]` items
   - Nằm trong `sources[]` array của web catalog

4. **`web/plugin.json`**: Link tổng cho web viewer
  - Mirror root-like từ `ref/monitor.json`
  - Hiển thị By Extension
  - Format: `{ metadata, data[] }`

5. **`web/catalog.json`**: Sidecar cho source view
  - Mirror metadata/source từ `ref/monitor.json`
  - Hiển thị By Source + reference metadata
  - Format: `{ metadata, summary, referenceListUrl, sources[] }`

## Aggregate structure

### Main link (web/plugin.json)

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "data": [
    { "name": "...", "author": "...", "type": "novel", "path": "..." }
  ]
}
```

### Source sidecar (web/catalog.json)

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "sources": [
    // External sources from ref/monitor.json
    {
      "id": "...",
      "url": "https://raw.githubusercontent.com/.../plugin.json",
      "content": {
        "data": [
          // Items từ external source
          { "name": "...", "author": "...", ... }
        ]
      }
    }
  ],
  "referenceListUrl": "..."
}
```

Web viewer load split files:
- By Extension từ `web/plugin.json`
- By Source từ `web/catalog.json`

## Danh sách nguồn cập nhật (raw URL)

Danh sách nguồn đầy đủ được quản lý tại `references/remote-sources.json`.

1. darkrai9x-main - https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/plugin.json
2. darkrai9x-chinese - https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/chinese_plugin.json
3. lethituyen-main - https://raw.githubusercontent.com/lethituyen/vbooks-extension/refs/heads/master/plugin.json
4. moleys-main - https://raw.githubusercontent.com/Moleys/vbook-ext/main/plugin.json
5. dat-bi-main - https://raw.githubusercontent.com/dat-bi/ext-vbook/main/plugin.json
6. soulgod-nahona-main - https://raw.githubusercontent.com/SoulGodEve9x9/Vbook-ext/Nahona/plugin.json
7. hieunm3103-main - https://gitlab.com/hieunm3103/vbook-extension/-/raw/main/plugin.json
8. baobao666888-main - https://raw.githubusercontent.com/BaoBao666888/ext-vbook-w/main/plugin.json
9. duongden-main - https://raw.githubusercontent.com/duongden/vbook/refs/heads/main/plugin.json
10. longvuu-main - https://raw.githubusercontent.com/longvuu/ext/refs/heads/master/plugin.json
11. tuanhai03-main - https://raw.githubusercontent.com/TuanHai03/vbook-extensions/refs/heads/main/plugin.json
12. willsun28-main - https://raw.githubusercontent.com/WillSun28/vbook-extensions/refs/heads/main/plugin.json
13. gh369-639-main - https://raw.githubusercontent.com/gh369-639/vbook-ext-public/refs/heads/main/plugin.json
14. mizhm-main - https://raw.githubusercontent.com/mizhm/vbook-extensions/refs/heads/main/plugin.json
15. kur21-main - https://raw.githubusercontent.com/kur21/vbook-ext/refs/heads/main/plugin.json
16. sonzin-main - https://raw.githubusercontent.com/sonzin/vbook-extension/refs/heads/main/plugin.json
17. alexsonxxx-main - https://raw.githubusercontent.com/alexsonxxx/vbook/refs/heads/main/plugin.json
18. kychitoge-main - https://raw.githubusercontent.com/kychitoge/vbook-ext/main/plugin.json
19. gold2k2k2k-main - https://raw.githubusercontent.com/Gold2k2k2k/HTri-Vbook-Ext/refs/heads/main/plugin.json
20. evamirion-main - https://raw.githubusercontent.com/Evamirion/vbook-ext/main/plugin.json
21. hienpro00123-main - https://raw.githubusercontent.com/hienpro00123/vbook_MeoU/refs/heads/main/plugin.json
22. hieu45666-main - https://raw.githubusercontent.com/hieu45666/vbook_ext/main/plugin.json
23. hishirooo-main - https://raw.githubusercontent.com/hishirooo/vbook-ext/master/plugin.json
24. hajljnopera-main - https://raw.githubusercontent.com/hajljnopera/vbook-ext/main/plugin.json
25. bqy-main - https://raw.githubusercontent.com/BanQuyY/Vbook/main/plugin_vb.json
26. bexom-main - https://raw.githubusercontent.com/B3x0m/vbook-ext/main/plugin.json
27. chanhnh-main - https://raw.githubusercontent.com/Chanhnh/vbook-ext/main/plugin.json
28. aleshaonon-main - https://raw.githubusercontent.com/seyah24/vbook-exts/main/plugin.json
29. beast666-main - https://raw.githubusercontent.com/khoa301020/vbook-ext/master/plugin.json
30. tamchau-main - https://raw.githubusercontent.com/TamChau/vbook-extensions/main/plugin.json
31. springpeachvinh-main - https://raw.githubusercontent.com/SPRINGPEACHVINH/vbook-ext/main/plugin.json
32. laofun-main - https://raw.githubusercontent.com/laofun/vbook-extensions-with-filter/master/plugin.json
33. ivan1hai-main - https://raw.githubusercontent.com/Ivan1hai/ext/main/plugin.json
34. darkrai9x-translate - https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/translate.json
35. darkrai9x-tts - https://raw.githubusercontent.com/Darkrai9x/vbook-extensions/refs/heads/master/tts.json

**Note**: Sync logic external config, không cứng trong codebase - tham khảo `ref/monitor.json` metadata

## Snapshot contribute hiện tại

Sau lần sync gần nhất:
- Repo nguồn: 35
- Extension aggregate: 497
- Nguồn `ivan1hai-main`: 27 extension

## Danh sách ext hiện có (community)

- https://xn--ngc-bmz.vn/i/vbook/extension_list.php#id-22

## Quy tắc khi tham khảo

1. Verify DOM/XHR trên site thực tế trước khi tái sử dụng selector.
2. Rules trong `docs/AI_CODE_EXT_VBOOK.md` luôn ưu tiên cao nhất.
3. Refactor về syntax tương thích Rhino nếu gặp snippet không tương thích.
4. Nếu `gen.js` và `search.js` trùng logic, tách function chung sang `utils.js`.

## Dedup Priority (cho contributors)

1. **Key dedupe**: `domain(source) + author`.
2. Cùng domain khác author → được phép cùng tồn tại.
3. Cùng key → version cao hơn ưu tiên.
4. Nếu bằng version → trust order:
   - `extensions/` (personal)
   - darkrai9x-vbook-extensions
   - dat-bi-ext-vbook
   - các nguồn khác
5. Deterministic: lexical path khi vẫn tie.

## Web aggregate cập nhật

```bash
# Rebuild personal extension manifests
npm run build:catalog

# Sync community aggregate into web/plugin.json + web/catalog.json
npm run sync:web-catalog

# Verify web/plugin.json được update
cat web/plugin.json | head -20
```

Workflow:
1. Edit/create extension qua CLI
2. Chạy `npm run build:catalog` nếu personal extension đổi
3. Chạy `npm run sync:web-catalog` khi community aggregate đổi
4. Web viewer tự động load updated `web/plugin.json` + `web/catalog.json`

