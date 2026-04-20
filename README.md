# VBook Tool

Repo này là công cụ 2 trong 1 cho VBook:

- **Phân vùng cộng đồng**: Một project duy nhất trên Vercel phục vụ cả Giao diện (`web/`) và API Aggregate (`api/`) siêu tốc tại domain tùy chỉnh (VD: `vbookext.me`).
- **Phân vùng cá nhân**: `extensions/` + `tools/cli/` để bạn có thể tự thân tạo, sửa, và đóng gói extension của riêng mình trước khi ném lên app.

## Mục tiêu hệ thống

- **`extensions/`**: Thư mục chứa các extensions cá nhân công khai. Sau khi thêm/sửa, bắt buộc chạy `npm run build:catalog`.
- **`.private/extensions/`**: Thư mục chứa các extensions cá nhân không công khai.
- **`tools/cli/`**: Bộ công cụ tạo, sửa, và build extension (CLI Tool Version 3).
- **`web/`**: Giao diện hiển thị web (Frontend) - Được serve trực tiếp từ Vercel.
- **`api/`**: Mã nguồn Vercel SDK phục vụ API Tiered Cache API (Backend) - Chạy song song trên cùng domain.
- **`web/remote-sources.json`**: File quan trọng nhất cấu hình danh sách các kho extensions trên Github/Gitlab của các nhóm khác.

## Bắt đầu nhanh

Cài đặt các gói phụ thuộc (cần thiết để sử dụng bộ công cụ):

```bash
npm install
```

Tạo file `.env` tại thư mục gốc (không bắt buộc nếu chỉ code ext):

```env
VBOOK_IP=192.168.1.100
LOCAL_PORT=3000
VBOOK_AUTHOR=tên_của_bạn
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

## Lệnh CLI chi tiết

### Extension commands
| Lệnh | Mô tả |
|------|-------|
| `vbook ext --mode create --name NAME --source URL` | Scaffold extension mới |
| `vbook ext --mode edit --plugin PATH --description TEXT` | Update extension metadata |

### Build commands  
| Lệnh | Mô tả |
|------|-------|
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
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md): PR checklist, build/test steps.
- [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md): Deploy guide Unified (FE+BE) + cấu trúc Backend API Vercel V4.

