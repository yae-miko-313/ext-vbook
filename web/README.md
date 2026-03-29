# VBook Extension Catalog Viewer

Dashboard để duyệt catalog extension, tìm kiếm nhanh, copy raw link và theo dõi thống kê.

## How to Use

### Quick Start
```bash
# 1) Sync data
cd ..
npx vbook build-catalog
Copy-Item extensions/plugin.json web/catalog.json -Force

# 2) Run local web server
cd web
python -m http.server 8000
```

Mở: `http://localhost:8000`

## Features

- Dashboard: Total count, stats by type
- Search: Find by name, author, description
- Compact filter toolbar: Search + type + sort + copy quick-link
- Copy raw link: tổng catalog hoặc catalog theo từng nhóm
- Theme toggle + back-to-top

## File Structure

```
web/
├── index.html       # Main page
├── style.css        # Simple styling
├── script.js        # Logic
├── data.js          # JSON loader
├── catalog.json     # Extension data (auto-synced)
└── README.md        # This file
```

## Data Source

Loads from `catalog.json` which is a copy of `extensions/plugin.json`

When to sync:
- Run `npx vbook build-catalog`
- Sync `web/catalog.json` từ `extensions/plugin.json`
- (Optional) regenerate `extensions/catalogs/*.plugin.json` để quick-link theo nhóm luôn chính xác

## Troubleshooting

**No extensions showing?**
- Ensure catalog.json exists in web/ folder
- Check browser console (F12) for errors
- Use Python/Node server (not file:// protocol)

**Data not updating?**
- Copy latest extensions/plugin.json to web/catalog.json
- Refresh browser
