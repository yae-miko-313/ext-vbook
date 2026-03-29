# VBook Extension Catalog - GitHub Pages Deploy

## Current Deploy Flow

Project đã dùng workflow sẵn: `.github/workflows/deploy-pages.yml`.

Trigger deploy khi push thay đổi trong `web/**` lên `main`.

## Quick Deploy (Current)

```bash
# 1) Sync catalog data
npx vbook build-catalog
Copy-Item extensions/plugin.json web/catalog.json -Force

# 2) Commit web/docs changes
git add web/ README.md docs/
git commit -m "chore: sync web catalog and docs"

# 3) Push main
git push origin main
```

## What Happens In CI

- Workflow upload toàn bộ thư mục `web/` thành Pages artifact
- GitHub Pages deploy tự động từ artifact này
- Không cần tạo/force-push `gh-pages` thủ công

## Manual Preview (Local)

```bash
python -m http.server 8000 --directory web
```

Mở `http://localhost:8000`

## Site URL

Sau khi bật GitHub Pages:
- `https://USERNAME.github.io/vbook-ext/`

## Features

- Glass morphism UI + dark/light toggle
- Search/filter/sort/copy quick-link
- Responsive layout cho desktop/mobile
- Zero dependency frontend (vanilla HTML/CSS/JS)
