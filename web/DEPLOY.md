# VBook Extension Catalog - GitHub Pages Deploy

## Quick Deploy

```bash
# 1. Ensure files are committed
git add web/
git commit -m "feat: redesign web with glass morphism style"

# 2. Push to GitHub
git push origin all-in-one

# 3. Create gh-pages branch (first time)
git checkout --orphan gh-pages
git reset --hard
cp -r web/* .
git add .
git commit -m "deploy: initial github pages"
git push -u origin gh-pages

# 4. Set GitHub Pages in Settings
# Go to repo → Settings → Pages → Source: Deploy from a branch → gh-pages
```

## Auto Deploy Script

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [all-in-one]
    paths: [web/**]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to gh-pages
        run: |
          git config user.name "CI"
          git config user.email "ci@example.com"
          git checkout --orphan gh-pages
          git reset --hard
          cp -r web/* .
          rm web/ .gitignore
          git add .
          git commit -m "deploy: $(date)"
          git push -f origin gh-pages
```

## Manual Deploy

```bash
cd web
# Sync catalog before deploying
cp ../extensions/plugin.json catalog.json

# Push to gh-pages
git subtree push --prefix web origin gh-pages
```

## Site URL

After enabling GitHub Pages:
- `https://USERNAME.github.io/vbook-tool/`

## Features

✨ Glass morphism design (from global.css style)
🌓 Dark/Light mode toggle (localStorage)
🔍 Search, filter, sort extensions
📱 Responsive mobile-first
⚡ Zero dependencies
