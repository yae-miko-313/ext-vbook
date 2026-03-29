# Template Novel Extension

Reusable starter for building a VBook novel extension.

## Included Files

- plugin.json
- icon.png
- src/config.js
- src/home.js
- src/genre.js
- src/gen.js
- src/search.js
- src/detail.js
- src/page.js
- src/toc.js
- src/chap.js

## Quick Start

1. Copy this folder and rename it.
2. Update plugin metadata in plugin.json.
3. Replace BASE_URL/API_URL in src/config.js.
4. Implement selectors in src/gen.js, src/detail.js, src/toc.js, src/chap.js.
5. Build and test:

```bash
vbook test-all --plugin extensions/<your-extension>
vbook build --plugin extensions/<your-extension>
```

## Runtime Rules

- Always export one function: execute(...)
- Keep code Rhino-safe (no async/await, no optional chaining).
- Return with Response.success(...) / Response.error(...).
