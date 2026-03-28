# VBook Extension Tool

Personal development tool for VBook extensions.
Lấy tool gốc từ lão B

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
