# VBook CLI Workflow: Current State

## Repo Split

- **Community partition**: `ref/` + `web/`
- **Personal partition**: `extensions/` + `tools/cli/`
- **Shared support**: `code-reference/` + `docs/`

## Current CLI Commands

```bash
vbook ext --mode create|edit
vbook build --plugin PATH
vbook build-catalog
```

## Personal Workflow

### 1. Create extension
```bash
npm run ext:create -- --name MyExtension --source https://example.com
```
- Scaffold extension folder
- Generate `plugin.json`, `src/`, `icon.png`

### 2. Edit metadata
```bash
npm run ext:edit -- --plugin extensions/novel/my_ext --description "Updated"
```
- Update metadata only
- Keep code and assets intact

### 3. Build ZIP
```bash
npm run build -- --plugin extensions/novel/my_ext
```
- Package `src/` + `icon.png` into `plugin.zip`
- Use `--dry-run` when previewing

### 4. Rebuild catalog
```bash
npm run build:catalog
```
- Rebuild `extensions/{type}/plugin.json`
- Rebuild `extensions/plugin.json`

### 5. Sync community web catalog
```bash
npm run sync:web-catalog
```
- Generate `web/plugin.json` (root-like aggregate link)
- Generate `web/catalog.json` (source sidecar)
- Web viewer reads both files

## Community Workflow

- `ref/plugin.json` is the synced community aggregate of raw sources.
- `web/plugin.json` is the main aggregate file for By Extension.
- `web/catalog.json` is the sidecar file for By Source.
- `build:catalog` is for personal manifests.
- `sync:web-catalog` is for community viewer sync.

## Important Rules

- Do not manually edit generated catalog files.
- Do not manually edit generated catalog files.
- Use `sync:web-catalog` to update `web/plugin.json` + `web/catalog.json` from `ref/plugin.json`.
- Treat all generated files as outputs that serve one of the two partitions.
- Always run `npm run build:catalog` before commit or PR when personal extension data changes.
- Always run `npm run sync:web-catalog` before commit or PR when community aggregate changes.

## Outputs

- `extensions/{type}/plugin.json`
- `extensions/plugin.json`
- `web/plugin.json`
- `web/catalog.json`
- `extensions/**/plugin.zip`

## Deprecated Workflow

- `batch-fix`
- `ai-fix-queue`
- `check-duplicates`
- `sort extensions`
- old single-file raw copy flow for `sync:web-catalog`

## Notes

- This repo is a 2-in-1 tool: extension repair/build for the owner, and community catalog overview for everyone else.
- Any new folder/file should exist only to support one of those two missions.
