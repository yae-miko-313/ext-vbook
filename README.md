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

## CLI Commands

### Lint (phase 1)

Validate extension structure + metadata rules.

```bash
# Lint one extension
npx vbook lint --plugin extensions/ntruyen

# Lint all extensions/ (default when --plugin is omitted)
npx vbook lint

# JSON output for CI
npx vbook lint --json

# Fail when warnings exceed threshold
npx vbook lint --max-warnings 0

# Lint references corpus
npx vbook lint --refs

# Optional Rhino compatibility checks
npx vbook lint --rhino
```

Lint rules (current):

- Error: missing `plugin.json`, `icon.png`, `src/detail.js`, `src/toc.js`, `src/chap.js`
- Error: invalid `plugin.json` format or missing `metadata` / `script` object
- Error: `metadata.version` must be integer >= 1
- Error: `metadata.type` must be one of `novel|comic|chinese_novel|translate|tts`
- Warning: `metadata.locale` should be one of `vi_VN|zh_CN|en_US`
- Warning: detect `metadata.local` typo and suggest `metadata.locale`
- Warning: locale format with `-` should be normalized to `_` (ex: `vi_VN`)
- Warning: `metadata.author` should match workspace standard author
- Error: each `script.*` must be filename only (no `src/` prefix) and file must exist in `src/`
- Error: `script.detail`, `script.toc`, `script.chap` are required entries in `plugin.json`
- Error: `metadata.regexp` must be valid JavaScript regex string
- Error: `config` key type checks for common keys (`thread_num`, `delay`, `preload_size`, `max_length`, etc.)
- Warning: unknown `config` keys (local scan profile)
- Warning: unknown top-level keys in `plugin.json` (local scan profile)
- Warning: `metadata.regexp` anchor/sanity checks for detail matching
- Warning: noise files such as `plugin.zip` and `src/test.json`
- Warning: version mismatch between extension `metadata.version` and root catalog `plugin.json`
- Optional (`--rhino`): error on common unsupported syntax (`async/await`, `import/export`, `?.`, `??`)

Scope behavior:

- Local scan (`extensions/`): project-specific checks enabled (`author`, catalog sync, regexp heuristic)
- References scan (`--refs`): project-specific checks relaxed to focus on ecosystem compatibility signals

Exit code:

- `0`: no lint errors
- `1`: has lint errors or CLI runtime error

### Health (phase 2)

Summarize quality status and issue distribution from lint data.

```bash
# Health summary for local extensions/
npx vbook health

# Health summary for references/repos
npx vbook health --refs

# JSON output
npx vbook health --json

# CI strict mode
npx vbook health --refs --strict-exit

# Include Rhino compatibility checks in health scan
npx vbook health --refs --rhino --json
```

Health output includes:

- Global quality buckets (`clean`, `warnings-only`, `with-errors`)
- Top lint rules by frequency
- Scope-aware scan summary (`extensions` or `references`)
- Exit code is `0` by default for analytics; use `--strict-exit` to fail on errors

### Scaffold (phase 3)

Generate a new extension from template (interactive-first, flags for CI).

```bash
# Interactive (if missing params)
npx vbook scaffold

# Non-interactive
npx vbook scaffold --name MySite --source https://mysite.com --author kychi

# Preview only
npx vbook scaffold --name MySite --source https://mysite.com --author kychi --dry-run
```

Notes:

- Uses `extensions/vbook-ext-template` as source of truth
- Runs post-generate lint by default
- Use `--skip-lint` to bypass lint gate

### Fix (phase 4)

Propose/apply safe autofixes for common metadata/script issues.

```bash
# Propose changes only (no write)
npx vbook fix --plugin extensions/ntruyen

# Apply changes
npx vbook fix --plugin extensions/ntruyen --write

# Apply changes and clean artifact noise files
npx vbook fix --plugin extensions/ntruyen --write --cleanup-noise
```

Current safe autofixes:

- `metadata.local` -> `metadata.locale` when `locale` is missing
- Locale normalization (`vi-VN` -> `vi_VN`)
- `script.*` normalization to filename-only (strip `src/` and path parts)

### Verify (phase 4)

Run regression verification workflow.

```bash
# Offline structure verification
npx vbook verify --plugin extensions/ntruyen

# Offline + Rhino checks
npx vbook verify --plugin extensions/ntruyen --rhino

# Device online verification (wraps one-click test)
npx vbook verify --mode online --plugin extensions/ntruyen --ip 192.168.1.10 --port 8080
```

## CLI Phase Roadmap

### Phase 1 (done)

- `vbook lint`: structural + metadata validation, JSON/table output, CI-friendly exit codes

### Phase 2 (in progress)

- `vbook lint --refs`: scan the references corpus for ecosystem baselines
- `vbook health`: quality distribution and top issue analytics

### Phase 3 (done)

- Rhino syntax compatibility checks (safe subset, low false-positive) as opt-in flag `--rhino`
- `vbook scaffold`: template-based extension generator with lint gate

### Phase 4 (in progress)

- `vbook verify`: offline/online regression verification
- Additional plugin.json config schema validation (done)
- `vbook fix`: safe autofix pipeline with propose/write modes (done, expand rules next)
