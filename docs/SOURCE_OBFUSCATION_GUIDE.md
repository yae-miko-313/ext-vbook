# 🔐 Hướng dẫn Obfuscate & Mã hóa bảo mật Mã nguồn Extension

Tài liệu này hướng dẫn chi tiết quy trình bảo vệ bản quyền, chống sao chép ngược (Reverse Engineering) mã nguồn JavaScript của Extension bằng cách kết hợp **Obfuscation (Làm rối mã)** và **AES-256-CBC Encryption (Mã hóa đối xứng)** thông qua bộ công cụ dòng lệnh VBook.

---

## ⚡ Tóm tắt nhanh (Quick Start - 30 giây)

```bash
# 1. Cài đặt các công cụ phụ trợ làm rối
npm install

# 2. Chạy tự động quy trình đóng gói mã hóa cho extension mẫu
npm run encrypt:truyencv
```
Hệ thống sẽ thực hiện làm rối, mã hóa toàn bộ code và xuất ra tệp tin phân phối hoàn chỉnh: `extensions/novel/kychi_truyencv/plugin.zip`.

---

## 📋 1. Quy trình Mã hóa 7 bước Tiêu chuẩn (VBook Pipeline)

```text
Cấu hình Metadata ──> Tạo Key ──> Làm rối (Obfuscate) ──> Mã hóa AES ──> Cập nhật plugin.json ──> Đóng gói ZIP ──> Xác thực
```

### Bước 1: Khai báo Metadata đầy đủ
Tệp tin `plugin.json` bắt buộc phải có thuộc tính `source` và `author` hợp lệ:
```json
{
  "metadata": {
    "source": "https://truyencv.io",
    "author": "kychi"
  }
}
```

### Bước 2: Sinh Khóa Mã hóa tự động (Key Derivation)
Thuật toán sinh khóa dựa trên Metadata để đảm bảo tính duy nhất:
```text
PAYLOAD = SALT + SOURCE + AUTHOR
        = "com.vbook.app" + "https://truyencv.io" + "kychi"

HEX_KEY = MD5(PAYLOAD)
AES_KEY = SHA256(HEX_KEY)       ← Khóa AES-256 32-bytes
IV = 16 bytes giá trị 0 (Null IV) ← Tiêu chuẩn của VBook Runtime
```

### Bước 3: Làm rối mã nguồn (Obfuscate)
Biến đổi các file `.js` thô thành các file `.bundle.js` làm rối mã:
```bash
npm run encrypt:obfuscate -- extensions/novel/kychi_truyencv
```
* **Input**: `src/home.js` (dễ đọc, dễ sửa).
* **Output**: `src/home.bundle.js` (rút gọn về 1 dòng duy nhất, các biến bị đổi thành `_0x4a2c...`, chống đọc hiểu cấu trúc logic).

### Bước 4: Mã hóa mã nguồn (Encrypt)
Mã hóa tệp tin đã làm rối thành tệp tin mã hóa `.encrypted.js`:
```bash
npm run encrypt:aes -- extensions/novel/kychi_truyencv
```
* **Thuật toán**: AES-256-CBC mã hóa nhị phân.
* **Định dạng đầu ra**: Chuỗi Base64 kết hợp thay thế token bảo mật (`+` thành `x0P1Xx`, `/` thành `x0P2Xx`, `=` thành `x0P3Xx`).

### Bước 5: Cập nhật chỉ định trong `plugin.json`
Tự động chuyển cấu hình chạy script từ file `.js` sang file mã hóa `.encrypted.js` và bật cờ `encrypt`:
```json
{
  "metadata": {
    "encrypt": true
  },
  "script": {
    "home": "home.encrypted.js"
  }
}
```

### Bước 6: Đóng gói thành ZIP
Nén các file mã hóa và icon thành file ZIP phân phối chính thức:
```bash
npm run build:ext -- --plugin extensions/novel/kychi_truyencv/plugin.json
```

### Bước 7: Xác thực & Giải mã thử nghiệm
Sử dụng bộ công cụ Decoder để kiểm tra xem file ZIP có giải mã thành công không:
```bash
node tools/cli/vbook_decoder.js extensions/novel/kychi_truyencv/plugin.zip
# Kết quả mong đợi: [+] Decoded: 7/7 ✅
```

---

## 🛠️ 2. Các lệnh CLI hỗ trợ mã hóa

### 🚀 Lệnh tự động hóa toàn bộ quy trình (Master Pipeline)
Thực hiện toàn bộ các bước làm rối, mã hóa, cập nhật metadata và đóng gói ZIP trong 1 lệnh duy nhất:
```bash
npm run encrypt:pipeline -- extensions/novel/kychi_truyencv
```

### 📋 Chạy từng bước (Manual Mode)
```bash
# 1. Làm rối code
npm run encrypt:obfuscate -- extensions/novel/kychi_truyencv

# 2. Mã hóa code
npm run encrypt:aes -- extensions/novel/kychi_truyencv

# 3. Đóng gói ZIP
npm run build:ext -- --plugin extensions/novel/kychi_truyencv/plugin.json
```

---

## ⚠️ 3. Ba cạm bẫy chí mạng & Giải pháp xử lý (Traps & Workarounds)

Dựa trên thực tế vận hành và debug trên ứng dụng vBook di động, có 3 cạm bẫy cực kỳ nguy hiểm nhà phát triển bắt buộc phải nắm rõ khi thiết kế mã hóa:

### 1️⃣ Lỗi nạp động thư viện `load("config.js")`
* > [!CAUTION]
  > **Bẫy lỗi**: Hệ thống vBook chỉ tự động giải mã các script được khai báo tường minh trong phần `"script"` của `plugin.json`. Nếu bạn mã hóa `config.js` rồi nạp động bằng lệnh `load("config.js")` ở các script khác, bộ biên dịch Rhino sẽ đọc file `config.js` dưới dạng mã hóa thô (chưa giải mã), gây ra lỗi cú pháp hiển thị chữ lạ và làm sập ứng dụng.
* **Giải pháp (Chuẩn công nghiệp)**: Quy trình đóng gói mã hóa của VBook sẽ **tự động chèn trực tiếp toàn bộ nội dung của file `config.js` lên đầu mỗi file bundle trước khi thực hiện mã hóa**, sau đó loại bỏ dòng lệnh `load("config.js");` ra khỏi mã nguồn. Cách thức này giúp mỗi file mã hóa hoạt động hoàn toàn độc lập (self-contained) và bảo mật tuyệt đối logic cấu hình của bạn.

### 2️⃣ Chuỗi giả lập "null" / "undefined" từ Settings Bridge của App
* **Bẫy lỗi**: Trên một số phiên bản của app vBook, khi người dùng để trống một cấu hình nhập liệu tùy chọn (ví dụ: `USER_TOKEN`), Settings Bridge của ứng dụng có thể truyền vào biến JavaScript chuỗi literal là `"null"` hoặc `"undefined"` (dưới dạng text) thay vì giá trị rỗng hoặc `null` thực tế. Điều này sẽ khiến các câu lệnh kiểm tra logic thông thường như `if (token)` bị lừa và hoạt động sai lệch.
* **Giải pháp**: Luôn xây dựng hàm xác thực dữ liệu đầu vào nghiêm ngặt:
  ```javascript
  function isConfigValid(val) {
      if (!val) return false;
      var str = String(val).trim();
      if (str === "" || str.toLowerCase() === "null" || str.toLowerCase() === "undefined") {
          return false;
      }
      return true;
  }
  ```

### 3️⃣ Sập Settings Bridge do cấu hình trống
* **Bẫy lỗi**: Nếu người dùng hoàn toàn không nhập bất kỳ thông tin nào vào form cài đặt tùy chọn và bạn không thiết lập giá trị mặc định cho form đó trong `plugin.json`, Settings Bridge của app vBook có thể bị sập hoàn toàn hoặc không truyền được bất kỳ cấu hình nào khác vào extension.
* **Giải pháp**: Luôn thiết lập `"default": ""` cho tất cả các cấu hình tùy chọn dạng text hoặc multiline trong `plugin.json` để ứng dụng luôn có dữ liệu mặc định để truyền vào runtime.

---

## 🔒 So sánh hiệu quả bảo vệ mã nguồn

| Chỉ số | Mã nguồn trần (Plain) | Làm rối (Obfuscated) | Mã hóa (AES-256) |
| :--- | :--- | :--- | :--- |
| **Độ rõ ràng** | ✅ Dễ đọc (100%) | ❌ Cực kỳ khó đọc (1%) | ❌ Hoàn toàn không thể đọc (0%) |
| **Độ an toàn** | ❌ Không bảo mật | ⚠️ Có thể de-obfuscate | ✅ Bảo mật tuyệt đối |
| **Bẻ khóa** | Dễ dàng | Khó khăn | Không thể (Nếu không có key) |
| **Dung lượng file** | Thấp (~50KB) | Rất thấp (~35KB) | Thấp (~47KB - Base64) |
| **Độ tin cậy chạy** | ✅ Ổn định | ✅ Ổn định | ✅ Ổn định (Nếu làm đúng chuẩn) |
