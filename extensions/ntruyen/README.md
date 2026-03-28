# Jay20 nTruyen Extension

Personal VBook extension for reading novels from `ntruyen.biz`.

## Files

- `plugin.json`: extension metadata.
- `icon.png`: extension icon.
- `src/home.js`: home categories.
- `src/genre.js`: genre list.
- `src/gen.js`: shared listing parser.
- `src/search.js`: keyword search.
- `src/detail.js`: novel details.
- `src/page.js`: chapter pages.
- `src/toc.js`: chapter list.
- `src/chap.js`: chapter content.

## Local Development

From workspace root:

```bash
vbook test-all --plugin extensions/ntruyen
vbook debug extensions/ntruyen/src/home.js --plugin extensions/ntruyen
vbook build --plugin extensions/ntruyen
```

## Notes

- Runtime target is Rhino, so avoid unsupported modern JS syntax.
- Main entry in every script is `function execute(...)`.
