# VBook Extension Catalog Viewer

Simple dashboard to view all extensions in the catalog.

## How to Use

### Quick Start
```bash
# Ensure catalog.json exists (auto-synced from extensions/plugin.json)
cd web
python -m http.server 8000

# Then open: http://localhost:8000
```

## Features

- Dashboard: Total count, stats by type
- Search: Find by name, author, description
- Filter: By extension type
- Sort: A-Z, Version (newest), Author

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
- After running `npx vbook build-catalog`, copy the new json to `web/catalog.json`
- Or: `cp extensions/plugin.json web/catalog.json`

## Troubleshooting

**No extensions showing?**
- Ensure catalog.json exists in web/ folder
- Check browser console (F12) for errors
- Use Python/Node server (not file:// protocol)

**Data not updating?**
- Copy latest extensions/plugin.json to web/catalog.json
- Refresh browser
