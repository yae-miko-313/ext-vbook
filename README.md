# VBook Tool - Extension Manager & CLI

Bộ công cụ quản lý, đóng gói và đồng bộ hóa extension cho hệ sinh thái VBook. Hỗ trợ cả quản lý local qua CLI và hiển thị cộng đồng qua Unified Web Server trên Vercel.

## Tính năng chính

- **vBook VSCode Tester**: A dedicated VS Code extension for rapid testing and deployment of extension payloads against local or remote APIs.
- **CLI Management**: Tạo, sửa metadata, và đóng gói extension (`plugin.json`, `src/`, `icon.png`).
- **Unified Vercel Hosting**: Giao diện và API chạy chung 1 dự án Vercel tại `vbookext.me`.
- **Tiered Cache Backend**: API tự động đồng bộ từ nhiều nguồn GitHub (Community) và ưu tiên hiển thị Extension cá nhân (Local).
- **Personal Catalog**: Tự động build manifest cho extension bạn đang phát triển để hiển thị tức thì trên web viewer.

## Cài đặt

```bash
git clone https://github.com/kychitoge/vbook-ext.git
cd vbook-ext
npm install
```

Thiết lập `.env` (Tùy chọn cho CLI):

```env
VBOOK_IP=192.168.1.100       # IP máy chạy VBook app (để sync wifi)
VBOOK_AUTHOR=tên_của_bạn      # Tác giả mặc định khi tạo ext
```

## Workflow chính (4 Bước)

### 1️⃣ Tạo extension mới

```bash
npm run ext:create -- --name MyExtension --source https://example.com
```

Scaffold thư mục + plugin.json template. Hint: Tham khảo `docs/AI_CODE_EXT_VBOOK.md` cho contract khi viết extension.

### 2️⃣ Sửa metadata extension

```bash
npm run ext:edit -- --plugin extensions/novel/my_ext --description "Mô tả mới"
```

Update `plugin.json` metadata (author, version, description, source, vv).

### 3️⃣ Build extension thành ZIP

```bash
npm run build:ext -- --plugin extensions/novel/my_ext
```

Pack `src/` + `icon.png` vào chung `plugin.zip` để đem đi cài đặt trực tiếp.

### 4️⃣ Rebuild catalog manifests

```bash
npm run build:catalog
```

Quét `extensions/*/` và build lại danh mục:

- `extensions/{type}/plugin.json`
- `extensions/plugin.json`

**BẮT BUỘC** chạy sau khi thêm/sửa extension cá nhân.

## Hướng dẫn lệnh (Reference)

### Extension commands

| Lệnh | Mô tả |
| :--- | :--- |
| `vbook ext --mode create --name NAME --source URL` | Scaffold extension mới |
| `vbook ext --mode edit --plugin PATH --description TEXT` | Update extension metadata |

### Build commands

| Lệnh | Mô tả |
| :--- | :--- |
| `vbook build --plugin PATH` | Package extension thành plugin.zip |
| `vbook build --plugin PATH --dry-run` | Preview (không tạo file) |
| `vbook build-catalog` | Rebuild local catalog files |

### NPM scripts (aliases)

```bash
npm run vercel-dev              # Chạy local dev server (FE+BE)
npm run build:ext               # build --plugin (Build Extension)
npm run build:catalog           # build-catalog
```

## Cấu trúc Repo

```text
extensions/                     # Nơi chứa config và raw JS của ext
├── novel/
│   └── text_ext/
│       ├── src/
│       ├── icon.png
│       └── plugin.json
└── plugin.json

.private/                       # Extension tự dùng, không công khai
└── extensions/

tools/cli/
├── index.js                    # Core CLI
└── ...

web/                            # Giao diện hiển thị extension cộng đồng
├── index.html
├── remote-sources.json         # Danh sách URL manifest cộng đồng
├── script.js
└── style.css

api/                            # Vercel Backend Cache & Sync (V4)
└── ...

docs/                           # Tài liệu tham khảo của Repo
├── AI_CODE_EXT_VBOOK.md
├── CONTRIBUTING.md
└── DEPLOY_VERCEL.md            # Tài liệu triển khai Unified Vercel
```

_Tham khảo thêm chi tiết triển khai Cloud trong [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)_

## Tài liệu

- [docs/AI_CODE_EXT_VBOOK.md](docs/AI_CODE_EXT_VBOOK.md): Hướng dẫn viết hàm parse JS cho AI Agent/Dev.
- See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on setting up your environment. For the VS Code Tester, refer to [docs/VSCODE_TESTER.md](docs/VSCODE_TESTER.md).
- [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md): Deploy guide Unified (FE+BE) + cấu trúc Backend API Vercel V4.
