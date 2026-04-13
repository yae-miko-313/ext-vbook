# Deploy Web Catalog (GitHub Pages)

## Pipeline

Workflow deploy: `.github/workflows/deploy-pages.yml`

Trigger khi push thay đổi trong `web/**`.

## Trước khi push

```bash
npm run full-sync
```

Lệnh trên sẽ tái sinh toàn bộ web artifacts:
- `web/plugin.json` (snapshot fallback)
- `web/catalog.json` (snapshot fallback sidecar)
- `web/remote-sources.json` (manifest cho realtime mode)

Sau đó commit/push:

```bash
git add web/ README.md docs/
git commit -m "chore: sync catalog and docs"
git push origin main
```

## Local Preview

```bash
python -m http.server 8000 --directory web
```

## Contributing

Xem hướng dẫn chung:

- `../docs/CONTRIBUTING.md`
