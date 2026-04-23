# vBook VSCode Tester 🛠️

**vBook VSCode Tester** is a powerful development companion designed to streamline the testing workflow for vBook extension developers. It allows you to test, build, and install extension payloads against a local or remote API directly from your VS Code sidebar.

---

## 🚀 Key Features

* **Integrated Sidebar Container**: Access all testing tools from a dedicated, compact view in the VS Code Activity Bar.
* **Smart Workspace Detection**: Automatically identifies valid extension folders (containing `plugin.json` and a `src/` directory).
* **Dynamic Script Selection**: Parses your `plugin.json` to let you pick which script to test (home, toc, chap, etc.).
* **Flexible Arguments**: Enter varargs easily with a one-line-per-argument input field.
* **Persistent History**: Remembers your recent server URLs, argument sets, and test runs for rapid iteration.
* **Real-time Feedback**: Streams request context and full API responses into a dedicated VS Code terminal for deep debugging.
* **Core Workflow Integration**: Direct calls to:
  * `/extension/test`: Validate logic and output.
  * `/extension/build`: Package the extension for distribution.
  * `/extension/install`: Deploy directly to a connected test device.

---

## 🛠️ Installation & Local Setup

### Running from Source

1. Open the project root or the `vbook-vscode-tester` folder in VS Code.
2. Press **F5** to launch the **Extension Development Host**.
3. In the new window, open any workspace containing your vBook extension projects.
4. Click the **vBook Test** icon in the Activity Bar on the left.
5. Alternatively, use the command palette (`Ctrl+Shift+P`) and run: `vBook: Focus Tester`.

---

## 📖 Usage Guide

### 1. Extension Selection

The tester treats a folder as a valid extension if it contains:

* `plugin.json`: The extension manifest.
* `src/`: The directory containing your JavaScript logic.
* *Optional*: `icon.png` (will be sent as part of the payload if present).

### 2. Testing Logic

1. Select your target extension folder from the dropdown.
2. Choose the script phase you want to execute (e.g., `chap`).
3. Provide the necessary arguments (URL, page number, etc.), one per line.
4. Hit **Run Test**. The terminal will show the raw request being sent and the formatted JSON response from the API.

---

## 📝 Notes

* Ensure your local vBook API server is running before executing tests.
* The tester sends the entire source code of the extension to the `/test` endpoint for server-side evaluation.

---

> [!TIP]
> Use the **Remember Last Run** feature to quickly re-test logic after making small code changes. You don't have to re-enter your arguments every time!

> [!IMPORTANT]
> The extension requires a compatible vBook API server (local or remote) to process the `/extension/*` endpoints.
