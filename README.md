# VBook Extension Tool

Personal development tool for VBook extensions.
Lấy tool gốc từ lão B

Developer / AI workflow, Rhino rules, and how to use [community extension repos](https://github.com/Darkrai9x/vbook-extensions) as reference without breaking local conventions: see [docs/AI_CODE_EXT_VBOOK.md](docs/AI_CODE_EXT_VBOOK.md).

## To Add New Extension

1. Copy `extensions/vbook-ext-template/` folder with new name
2. Edit `plugin.json`
3. Update src files (chap.js, config.js, etc.)
4. Test with CLI from `tools/cli/`

## Quick Start

```bash
npm install
npx vbook build --plugin extensions/[your-ext]
npx vbook install --plugin extensions/[your-ext]
```

Setup `.env` with local device config before running commands.
