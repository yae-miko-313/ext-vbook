# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Mỗi lần trả lời hãy bắt đầu bằng [con chào bố]

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## 🛠️ 5. VBook Project-Specific Cheat Sheet & Rules

This section merges VBook's codebase architecture and developer workflow instructions.

### 📋 Core User Rules (Quy tắc cốt lõi của dự án)
1. **Luôn luôn đọc tài liệu** và quy tắc trước khi viết hoặc sửa bất kỳ dòng code nào.
2. **Luôn luôn dọn dẹp log** và xóa bỏ các testcase thừa sau khi thực hiện chạy thử nghiệm.
3. **Luôn luôn hỏi ý kiến xác nhận** của User trước khi commit hoặc push code lên GitHub.
4. **Luôn luôn nâng version** trong `plugin.json` lên thêm 1 phiên bản trước khi chuẩn bị commit.

### 💻 Core CLI Commands (Lệnh dòng lệnh chính)
* **Khởi tạo extension**: `npm run ext:create -- --name <Tên_Extension> --source <URL_Nguồn>`
* **Cập nhật metadata**: `npm run ext:edit -- --plugin <đường_dẫn_folder> --description "Mô tả"`
* **Đóng gói ZIP**: `npm run build -- --plugin <đường_dẫn_folder>`
* **Cập nhật catalog tổng**: `npm run build:catalog` (Bắt buộc chạy trước khi commit nếu có đổi extension)
* **Đồng bộ catalog web**: `npm run sync:web-catalog` (Chỉ dùng cho phân vùng cộng đồng web)

### ⚠️ Rhino Runtime ES5 Constraints (Ràng buộc chạy script của App)
Script của extension chạy trên môi trường **Rhino (ES5)**. 
* **Được dùng**: `var`, `function`, regex, JSON, các hàm mảng ES5 (`forEach`, `map`, `filter`), `load("config.js")`.
* **CẤM DÙNG**: `let`, `const`, arrow functions (`=>`), `async/await`, `Promise`, optional chaining (`?.`), nullish coalescing (`??`), import/export.

### 📚 Key Documentation Paths
* **Master Dev Guide**: [docs/EXTENSION_DEVELOPMENT_GUIDE.md](file:///d:/My%20Code/vbook-tool/docs/EXTENSION_DEVELOPMENT_GUIDE.md)
* **JSBridge & Crypto APIs**: [docs/JSBRIDGE_REFERENCE.md](file:///d:/My%20Code/vbook-tool/docs/JSBRIDGE_REFERENCE.md)
* **Decryption Knowledge Base**: [docs/DECRYPTION_PATTERNS.md](file:///d:/My%20Code/vbook-tool/docs/DECRYPTION_PATTERNS.md)
* **Source Protection (Obfuscation)**: [docs/SOURCE_OBFUSCATION_GUIDE.md](file:///d:/My%20Code/vbook-tool/docs/SOURCE_OBFUSCATION_GUIDE.md)
* **Contributing Rules**: [docs/CONTRIBUTING.md](file:///d:/My%20Code/vbook-tool/docs/CONTRIBUTING.md)
