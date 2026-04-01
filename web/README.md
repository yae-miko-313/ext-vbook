# VBook Extension Catalog Viewer

Web viewer để duyệt catalog extension và copy raw link nhanh.

## Chạy local

```bash
npm run build-catalog
npm run sync:web-catalog
cd web
python -m http.server 8000
```

Mở: `http://localhost:8000`

## Tính năng

- Stats theo type
- Search theo tên, author, description
- Filter type + sort
- Copy quick-link theo catalog group
- Copy raw plugin path theo extension

## Nguồn dữ liệu

- Đọc từ `web/catalog.json`
- Được đồng bộ từ `extensions/plugin.json`

## Contributing

Xem hướng dẫn chung:

- `../docs/CONTRIBUTING.md`
