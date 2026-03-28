# Kychi VBook Extension Project

Monorepo for your personal VBook development flow:
- `tools/cli`: debug, test-all, install, build commands.
- `extensions/ntruyen`: your main extension source.

## Structure

```text
vbook-tool/
   tools/
      cli/
         index.js
         utils.js
   extensions/
      ntruyen/
         plugin.json
         icon.png
         src/
            *.js
   docs/
   .env
```

## Setup

```bash
npm install
```

Optional global command:

```bash
npm link
```

## Daily Commands

From project root:

```bash
npm run test:all
npm run build:ext
npm run install:ext
```

Or with direct CLI:

```bash
vbook test-all --plugin extensions/ntruyen
vbook debug extensions/ntruyen/src/home.js --plugin extensions/ntruyen
vbook install --plugin extensions/ntruyen
vbook build --plugin extensions/ntruyen
```

## Environment

Configure `.env` in project root:

```env
VBOOK_IP=192.168.1.10
VBOOK_PORT=8080
LOCAL_PORT=8080
VERBOSE=false
```

## Result Logs

- `[LOG FROM DEVICE]`: output from Rhino (`Console.log` / `Log.log`).
- `[RESULT]`: return value from `execute()`.
- `[EXCEPTION FROM DEVICE]`: runtime/syntax errors from device.
