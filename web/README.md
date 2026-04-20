# VBook Extension Catalog Viewer

Web viewer cho phân vùng cộng đồng: hiển thị extension hiện có, tác giả, contribute, và copy link theo 2 kiểu.

## Kiến trúc: Unified Vercel Rendering

**Realtime Mode (DEFAULT)**
- Frontend (HTML/JS) gửi yêu cầu trực tiếp đến API Backend (Vercel) chạy trên cùng domain.
- API Backend sẽ tổng hợp (aggregate) dữ liệu từ các nguồn remote repositories khai báo trong `web/remote-sources.json`.
- Flow: `Vercel (FE)` → `Vercel (API)` → `KV Cache / Live Fetch`.

**Local Development**
- Sử dụng `vercel dev` để chạy cả Frontend và Backend cùng lúc tại `http://localhost:3000`.
- Đảm bảo các API endpoint hoạt động giống hệt môi trường production.

## Chạy local

```bash
# Cài đặt môi trường
npm install

# Chạy Unified Dev Server (FE + BE)
npm run vercel-dev
```

Mở browser: `http://localhost:3000/`

## Cấu trúc dữ liệu (Backend-Driven)

Dữ liệu hiển thị trên web được cung cấp bởi các API endpoint:
- `/api/catalog.json`: Trả về danh sách chi tiết các nguồn và extension (By Source).
- `/api/plugin.json`: Trả về link tổng hợp chuẩn VBook (Link Tổng).
- `/api/health`: Trạng thái sống/chết của các site nguồn.

## Tính năng viewer

### Header: Statistics Dashboard
- Tổng ext, By Type (novel/comic/translate/...)
- Tổng repo nguồn tham khảo
- Nút "Copy Link Tổng" (Trỏ về `/api/plugin.json`)

### View Mode: By Extension (Mặc định)
- Mỗi extension cộng đồng là 1 card.
- Tự động hiển thị badge trạng thái (LIVE, DIE, MOVE, WAF) từ background health scan.

### View Mode: By Source
- Hiển thị theo từng Repository nguồn.
- Mở rộng để xem danh sách extension bên trong từng repo.

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|------------|---------|
| Web không load dữ liệu | API Backend lỗi hoặc KV chưa config | Kiểm tra log Vercel, đảm bảo `KV_REST_API_*` đã được set. |
| "Health badges" không hiện | KV cache chưa có data health | Chờ tiến trình background scan hoàn tất (5-10s sau khi load). |

## Contributing

- Xem hướng dẫn chung: [../docs/CONTRIBUTING.md](../docs/CONTRIBUTING.md)
- Hướng dẫn triển khai Unified Vercel: [../docs/DEPLOY_VERCEL.md](../docs/DEPLOY_VERCEL.md)
