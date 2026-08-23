# vBook Extensions Repository - hieu05

Nguồn mở rộng (extensions) của **vBook**

### 1. Link Nguồn Mở Rộng

Tải app tại: [VBook App](https://vbookapp.com/)

```bash
https://raw.githubusercontent.com/yae-miko-313/ext-vbook/main/plugin.json
```

### 🛠️ 5. Công cụ phát triển Extension (Developer Tools)

Bộ công cụ chính thức từ Admin vBook & Repo Tooling:

- **Tài liệu API chuẩn**: [docs/extension-api.md](./docs/extension-api.md)
- **Checklist kiểm tra**: [docs/verify-checklist.md](./docs/verify-checklist.md)
- **Master Skill Spec**: [.claude/skills/vbook-extensions/SKILL.md](.claude/skills/vbook-extensions/SKILL.md)

#### Lệnh CLI chính:

```bash
# Khởi tạo extension mới từ template chuẩn admin
npm run ext:create -- --name "Tên Extension" --source "https://domain.com" --type novel

# Test script trực tiếp với VBook app REST-API server
node .claude/skills/vbook-extensions/scripts/vbook.js test <ext-folder> <script.js> [args...]
# hoặc
npm run vbook:test -- <ext-folder> <script.js> [args...]

# Cài đặt extension trực tiếp vào VBook app
npm run vbook:install -- <ext-folder>

# Đóng gói file ZIP plugin
npm run vbook:build -- <ext-folder>

# Cập nhật lại catalog tổng trước khi commit
npm run build:catalog
```
