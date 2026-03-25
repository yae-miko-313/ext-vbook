# 🚀 VBook CLI Tool

Standalone Node.js tool to debug, install, and package VBook extensions.

## 🛠 1. Installation & Setup

Before running anything, open a terminal in the `vbook-tool` directory and run:
```bash
npm install
```

---

## 🏃 2. How to Run (Two Methods)

Choose the method that works best for you:

### Method A: Professional Shorthand (Recommended)
This method allows you to use the `vbook` command from any directory.
1. In `vbook-tool/`, run: `npm link`
2. Now, from your **plugin root**, just use:
   - `vbook test-all` (End-to-end flow test)
   - `vbook debug src/home.js` (Debug a specific file)
   - `vbook install` (Install to device)
   - `vbook build` (Package into zip)

### Method B: Direct Node.js (Simple)
If you don't want to link, you can call the tool directly using the file path:
```bash
node path/to/vbook-tool/index.js test-all
node path/to/vbook-tool/index.js debug src/home.js
node path/to/vbook-tool/index.js install
node path/to/vbook-tool/index.js build
```

---

## ⚙️ 3. Configuration

Edit the `.env` file in the `vbook-tool` directory to set your IP:
- `VBOOK_IP`: Your mobile device's IP (e.g., `192.168.1.10`).
- `VBOOK_PORT`: Port 8080.
- `LOCAL_PORT`: Port for the local server (default 8080).

---

## 🔍 4. How to Analyze Results

- **`[LOG FROM DEVICE]`**: Displays `Console.log()` and `Log.log()` output from your Rhino script on the phone.
- **`[RESULT]`**: The final value returned by your `execute()` function (JSON is auto-beautified).
- **`[EXCEPTION FROM DEVICE]`**: Shows runtime/syntax errors occurring on the phone.

---

## 💡 Pro Tips

- **Auto-Cleanup**: The tool automatically closes the server after each command to prevent `EADDRINUSE` errors.
- **Verbose**: Add `--verbose` or set `VERBOSE=true` in `.env` for more detailed network logs.
