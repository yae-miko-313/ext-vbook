# VBook Extension Catalog Viewer

Web viewer cho phân vùng cộng đồng: hiển thị extension hiện có, tác giả, contribute, và copy link theo 2 kiểu.

## Chạy local

```bash
# Rebuild personal extension manifests
npm run build:catalog

# Sync community aggregate into web/plugin.json + web/catalog.json
npm run sync:web-catalog

# Start web server
cd web
python -m http.server 8000
```

Mở browser: `http://localhost:8000/web/`

`npm run sync:web-catalog` là lệnh chuẩn để refresh dữ liệu web từ `ref/monitor.json`.

`npm run monitor:sources` sẽ fetch nguồn từ `references/remote-sources.json`, cập nhật `ref/monitor.json`, và tự sync luôn `web/plugin.json` + `web/catalog.json`.

## Cấu trúc dữ liệu

Root `plugin.json` của repo chỉ là manifest cá nhân, dạng:

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "data": [
    { "name": "...", "author": "...", "type": "novel" }
  ]
}
```

`web/plugin.json` là file aggregate cộng đồng dùng cho By Extension.

`web/catalog.json` là sidecar nguồn cho By Source (`summary`, `referenceListUrl`, `sources[]`).

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "data": [
    { "name": "...", "author": "...", "type": "novel" }
  ]
}
```

`web/catalog.json`:

```json
{
  "metadata": { "author": "kychi", "description": "..." },
  "summary": { "total": 35, "changed": 0, "unchanged": 35, "errors": 0 },
  "referenceListUrl": "...",
  "sources": [
    {
      "id": "alexsonxxx-main",
      "url": "https://raw.githubusercontent.com/alexsonxxx/vbook/...",
      "displayName": "alexsonxxx/vbook",
      "status": "active",
      "content": {
        "data": [ { "name": "...", ... } ]
      }
    }
  ]
}
```

## Tính năng viewer

### Header: Statistics Dashboard
- Tổng ext, By Type (novel/comic/chinese/...)
- Tổng repo nguồn tham khảo
- Link copy aggregate catalog (`web/plugin.json`)

### Community Focus
- Hiển thị ext cộng đồng theo view trực quan
- Hiển thị tác giả cho từng ext
- Hiển thị contribute/acknowledgement theo danh sách author

### View Mode: By Extension
- **Hiển thị**: Mỗi extension cộng đồng là 1 card
- **Source**: Đọc trực tiếp từ `web/plugin.json` (`data[]`)
- **Action buttons**: 
  - "Site URL": Mở trang gốc
  - "Copy Ext": Copy link raw ext từ repo
- **Author credits**: Đếm unique authors từ toàn bộ extension cộng đồng

### View Mode: By Source
- **Hiển thị**: Mỗi source repo là 1 card
- **Source**: Từ `web/catalog.json` (`sources[]`)
- **Info**: Header tối giản khi đóng; mở ra mới thấy đầy đủ metadata + toàn bộ ext
- **Action**: "Copy Source" - copy raw plugin.json URL

### Copy flows
- **Copy link tổng**: copy `web/plugin.json` để user paste một link duy nhất
- **Copy theo nguồn repo**: copy raw plugin.json URL của từng source

### Search
- Tìm theo: tên ext, author, description, source URL
- Case-insensitive, hỗ trợ tiếng Việt (NFKC normalized)

### Author Acknowledgement  
- Hiển thị unique authors + count
- Top 3 authors (ranked by contribution count)
- Distribution chart (top 8) with percentages

## Cập nhật dữ liệu

Snapshot hiện tại (sau sync gần nhất): 35 repo nguồn, 497 extension aggregate.

Mặc định web chạy ở chế độ **realtime**: browser sẽ đọc `web/remote-sources.json`, fetch trực tiếp các `raw plugin.json` từ repo nguồn và tự aggregate khi mở trang.

Nếu cần ép về snapshot tĩnh (đọc `web/plugin.json` + `web/catalog.json`), thêm query:

```
https://<your-pages-url>/?realtime=0
```

### Tự động (developer)
```bash
  npm run sync:web-catalog
```
Tái sinh:
- `web/plugin.json` (link tổng)
- `web/catalog.json` (sidecar nguồn)
- `web/remote-sources.json` (manifest nguồn cho realtime mode)

Logic sync có khử trùng theo `path` (fallback: `name+author+source+type`) để tránh double-count khi `ref/plugin.json` có cả `data[]` và `sources[].content.data[]`.

### Realtime (user - optional)
Sử dụng query parameter để đọc catalog từ custom source:
```
http://localhost:8000/web/?catalog=<URL_TO_PLUGIN_JSON>
```

Ví dụ:
```
http://localhost:8000/web/?catalog=https://raw.githubusercontent.com/user/repo/main/plugin.json
```

**Lưu ý**: URL phải là raw JSON file dạng root-like (`metadata` + `data[]`) như `web/plugin.json`, và CORS phải allow.

## Workflow cập nhật

1. **Edit local extensions**:
   ```bash
   npm run ext:edit -- --plugin extensions/novel/my_ext
   ```

2. **Build extension to ZIP** (nếu sẵn sàng distribute):
   ```bash
   npm run build -- --plugin extensions/novel/my_ext
   ```

3. **Sync community web catalog**:
   ```bash
  npm run sync:web-catalog
   ```
   
4. **Reload web viewer**: F5 hoặc `http://localhost:8000/web/`

## File structure

```text
web/
├── index.html              # Main page + layout
├── script.js               # Event handlers + render logic
├── data.js                 # Catalog loader + data parser
├── plugin.json             # AUTO-GENERATED aggregate root catalog (By Extension)
├── catalog.json            # AUTO-GENERATED source sidecar (By Source)
├── style.css               # Styling
├── theme.js                # Theme toggle
└── README.md               # (This file)
```

## Development notes

- HTML, CSS, JS không dùng framework (vanilla)
- Catalog loader support split format:
  - `web/plugin.json`: top-level `metadata`, `data[]`
  - `web/catalog.json`: `metadata`, `summary`, `referenceListUrl`, `sources[]`
- XHR CORS: Web server phải serve CORS headers cho external catalog URLs
- Mobile-friendly: Authors list collapse trên mobile (first 7 items, toggle expand)
- Web không phải nơi build ext cá nhân; nó chỉ hiển thị và copy catalogue của cả cộng đồng

## Contributing

- Xem hướng dẫn chung: [../docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md)
- PR checklist bao gồm: `npm run build:catalog` để update catalog

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|------------|---------|
| Web không load extension | `plugin.json` chưa được sync từ `ref/plugin.json` | Chạy `npm run sync:web-catalog` |
| "Lỗi: sai cấu trúc aggregate" | Missing `data[]` trong `plugin.json` | Kiểm tra `plugin.json` structure |
| Realtime catalog không load | CORS issue hoặc URL sai | Verify URL, check browser console |
| Author count = 0 | Chưa có extension hoặc author field trống | Kiểm tra `extensions/*/plugin.json` có `author` field |

