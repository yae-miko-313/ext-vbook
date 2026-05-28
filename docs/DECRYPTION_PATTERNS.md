# 🔐 Các mô hình Giải mã Nội dung Website (Decryption Patterns)

Tài liệu tri thức này tổng hợp các mô hình bảo mật dữ liệu phổ biến trên các website truyện/comic/video đích và hướng dẫn xây dựng kiến trúc giải mã tối ưu trong VBook Extension.

---

## ⚠️ Phân biệt Quan trọng
> [!WARNING]
> Tài liệu này nói về việc **Giải mã dữ liệu của website đích** (để lấy nội dung truyện/ảnh/phim).
> Để tìm hiểu cách **Mã hóa bảo vệ code JavaScript của Extension**, vui lòng xem: [SOURCE_OBFUSCATION_GUIDE.md](file:///d:/My%20Code/vbook-tool/docs/SOURCE_OBFUSCATION_GUIDE.md).

---

## 🗂️ 1. Bốn Mô hình Mã hóa Kinh điển trên các Website nguồn

Trong quá trình xây dựng extension, chúng ta thường gặp 4 kiểu cấu trúc dữ liệu sau:

```
┌─────────────────────────────────────────────────────────────┐
│  MÔ HÌNH BẢO MẬT DỮ LIỆU TRÊN CÁC WEBSITE NGUỒN            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣  MÃ HÓA XOR (Ví dụ: quykhu)                              │
│     ├─ Kiểu: Văn bản XOR + Mã hóa Base64                     │
│     ├─ Luồng: HTML → Tìm Key → Gọi API → Giải mã XOR        │
│     └─ Kỹ thuật: Base64 → Latin1 (Binary) → XOR → UTF8      │
│                                                             │
│  2️⃣  API TRỰC TIẾP (Ví dụ: Tomato Novel)                    │
│     ├─ Kiểu: Không mã hóa, sử dụng Token xác thực           │
│     ├─ Luồng: Gọi POST/GET kèm Token → Trả về JSON sạch      │
│     └─ Kỹ thuật: Tốt nhất - bảo trì dễ dàng, cực nhanh      │
│                                                             │
│  3️⃣  AES-256 CLIENT-SIDE (Ví dụ: MangaGo)                   │
│     ├─ Kiểu: Mã hóa AES-256-CBC có IV & ZeroPadding         │
│     ├─ Luồng: Dữ liệu ảnh ở dạng Base64 mã hóa trong HTML   │
│     └─ Vấn đề: Key không nằm trong HTML mà sinh động        │
│                                                             │
│  4️⃣  MÃ HÓA PHÔNG CHỮ (Ví dụ: Tomato Novel)                   │
│     ├─ Kiểu: Font Obfuscation (Ánh xạ Unicode lệch)          │
│     ├─ Luồng: Gọi API → Nhận nội dung chứa ký tự đặc biệt     │
│     └─ Kỹ thuật: Mảng charset dịch chuyển Unicode bias       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 2. Phân tích Chi tiết & Giải pháp Kỹ thuật

### 1️⃣ Mô hình XOR (XOR Cipher)
* **Cách thức bảo vệ**: Dữ liệu chương truyện chữ được mã hóa bằng thuật toán XOR tuần hoàn với một từ khóa (key) động, sau đó mã hóa Base64 trước khi trả về qua API.
* **Giải pháp bóc tách**:
  1. Trích xuất Regex tìm từ khóa: `var xorKey = html.match(/key\s*=\s*"([^"]+)"/)`.
  2. Tải payload Base64 từ API.
  3. Sử dụng thư viện `crypto.js` để parse Base64 về Latin1, chạy vòng lặp XOR từng ký tự với key tuần hoàn để lấy lại chuỗi UTF-8.
* **Đoạn code giải mã mẫu**:
  ```javascript
  load('crypto.js');
  
  function decryptXOR(base64Data, key) {
      var wa = CryptoJS.enc.Base64.parse(base64Data);
      var raw = CryptoJS.enc.Latin1.stringify(wa);
      var result = [];
      var keyLen = key.length;
      for (var i = 0; i < raw.length; i++) {
          result.push(String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % keyLen)));
      }
      return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Latin1.parse(result.join('')));
  }
  ```

### 2️⃣ Mô hình API Trực tiếp (Direct API)
* **Cách thức bảo vệ**: Không mã hóa nội dung. Dữ liệu được tải qua API dưới dạng JSON sạch nhưng yêu cầu Header hoặc Cookie xác thực (Token).
* **Giải pháp bóc tách**:
  - Không cần reverse-engineer thuật toán mã hóa.
  - Sử dụng Jsoup hoặc HTTP Client gọi trực tiếp API với các tham số cần thiết.
* **Đánh giá**: Đây là **Giải pháp tối ưu nhất** vì mã nguồn đơn giản, thực thi cực nhanh và dễ bảo trì lâu dài.

### 3️⃣ Mô hình AES-256 Client-Side
* **Cách thức bảo vệ**: Dữ liệu (ví dụ danh sách link ảnh comic) được mã hóa AES-256-CBC ngay trên server và nhúng vào HTML dưới dạng biến Base64 (ví dụ: `var imgsrcs = "bG4U2Jat..."`). Khóa AES (Key) không được hiển thị trực tiếp trong mã nguồn HTML mà được sinh động ở runtime hoặc nằm trong bundle JS đã bị nén.
* **Giải pháp bóc tách (Bí quyết thực tế)**:
  - Việc mò key giải mã thủ công cực kỳ tốn thời gian và dễ bị hỏng khi website thay đổi thuật toán.
  - **GIẢI PHÁP TỐI ƯU**: Sử dụng **Headless Browser (`Engine.newBrowser`)**. Do trình duyệt sẽ tự động thực thi các file JavaScript của website, trang web sẽ tự giải mã dữ liệu để hiển thị lên màn hình. Chúng ta chỉ cần khởi động trình duyệt ngầm, đợi trang web giải mã xong, và trích xuất các thẻ `<img>` đã được giải mã hoàn chỉnh từ DOM.

### 4️⃣ Mô hình Mã hóa Phông chữ (Font Obfuscation & Custom Charset Mapping)
* **Cách thức bảo vệ**: Để ngăn chặn việc cào dữ liệu văn bản tự động, một số website đọc truyện lớn (như fanqienovel.com) sử dụng phông chữ tùy biến (Custom Font) kết hợp ánh xạ lệch mã hóa Unicode. Khi cào HTML thô hoặc gọi API trực tiếp, văn bản nhận về sẽ là các ký tự lạ hoặc các ô vuông trống nằm trong dãy Unicode Private Use Area (ví dụ: `\uE3E8` đến `\uE55B`). Nhưng trên trình duyệt của người dùng, nhờ file font `.woff` hoặc `.ttf` đặc thù được tải về, các mã lệch này vẫn hiển thị đúng các chữ thường dùng.
* **Giải pháp bóc tách (Bí quyết thực tế)**:
  - Khảo sát và giải mã phông chữ tùy biến, lập bảng đối chiếu (Custom Charset Array) tương ứng với độ lệch ký tự (Bias).
  - Viết hàm ánh xạ ngược bằng cách lấy mã CharCode của ký tự lạ, trừ đi mã Unicode khởi điểm để làm chỉ mục (Index) tra cứu từ bảng Charset nhằm lấy lại ký tự gốc đúng nghĩa.
* **Đoạn code giải mã mẫu**:
  ```javascript
  function decodeFontObfuscation(obfuscatedText) {
      if (!obfuscatedText) return "";
      var str = String(obfuscatedText);
      var CODE_START = 58344; // Mã Unicode hex 0xE3E8 đại diện cho kí tự lệch đầu tiên
      var CODE_END = 58715;   // Mã kết thúc
      
      // Bảng charset ánh xạ đối chiếu tương ứng với các bias lệch
      var charset = ["体","y","十","现","快","便","话","却","月","物","水","的","放","知","..."]; 
      
      var result = "";
      for (var i = 0; i < str.length; i++) {
          var cc = str.charCodeAt(i);
          if (cc >= CODE_START && cc <= CODE_END) {
              var bias = cc - CODE_START;
              if (bias >= 0 && bias < charset.length && charset[bias]) {
                  result += charset[bias];
              } else { result += str.charAt(i); }
          } else { result += str.charAt(i); }
      }
      return result;
  }
  ```

---

## 📊 3. Bảng so sánh các phương pháp bóc tách

| Tiêu chí | XOR Cipher | Direct API | AES Client-Side | Font Obfuscation |
| :--- | :--- | :--- | :--- | :--- |
| **Độ phức tạp** | Trung bình | Thấp | Cao | Trung bình |
| **Sự phụ thuộc Key** | Cần tìm Key trong HTML | Không cần Key | Key sinh động / ẩn | Cần mảng Charset tĩnh |
| **Phương pháp giải** | Code thuật toán XOR thủ công | Gọi API trực tiếp kèm Token | Sử dụng `Engine.newBrowser()` | Tra cứu mảng dịch chuyển mã |
| **Độ ổn định** | Trung bình (Site đổi key) | Rất cao | Rất cao (Bằng Browser Engine) | Rất cao (Hiếm khi đổi charset) |
| **Tốc độ thực thi** | Nhanh | Cực nhanh | Trung bình (Tốn thời gian render) | Nhanh |

---

## 🏛️ 4. Kiến trúc Extension tối ưu tự động (Recommended Template)

Mẫu cấu trúc file `chap.js` thông minh, tự động chọn giải pháp bóc tách dữ liệu theo thứ tự ưu tiên tối ưu nhất:

```javascript
load('config.js');

function execute(url) {
    // ƯU TIÊN 1: Thử sử dụng Trình duyệt ngầm để lấy dữ liệu đã tự giải mã trong DOM (Dành cho JS-heavy / AES)
    var doc = tryBrowserEngine(url, 15000, 'img[src*="decrypted-cdn"]');
    if (doc) {
        return extractFromDOM(doc);
    }
    
    // ƯU TIÊN 2: Thử gọi API trực tiếp nếu phát hiện endpoint hoạt động
    var apiResponse = tryDirectAPI(url);
    if (apiResponse && apiResponse.ok) {
        return Response.success(apiResponse.data);
    }
    
    // ƯU TIÊN 3: Giải mã thủ công (XOR) nếu tìm thấy biến mã hóa và Key
    var html = fetch(url).text();
    var encryptedData = extractVariable(html, 'imgsrcs');
    var key = extractVariable(html, 'xor_key');
    if (encryptedData && key) {
        load('crypto.js');
        var decrypted = decryptXOR(encryptedData, key);
        return Response.success(decrypted);
    }
    
    return Response.error("Tất cả các phương thức trích xuất dữ liệu đều thất bại");
}

function tryBrowserEngine(url, timeout, selector) {
    if (Engine && Engine.newBrowser) {
        var browser = Engine.newBrowser();
        try {
            var page = browser.launch(url, timeout);
            var hasElements = page.select(selector).length > 0;
            if (hasElements) {
                return page; // Trả về trang đã render để trích xuất dữ liệu
            }
        } catch(e) {
            Log.log("Lỗi render trình duyệt ngầm: " + e.message);
        } finally {
            // Không đóng trình duyệt ở đây nếu cần trả về DOM, nhưng phải đóng sau khi dùng xong
            if (browser && browser.close) browser.close();
        }
    }
    return null;
}

function extractFromDOM(doc) {
    var images = [];
    doc.select('img[src*="decrypted-cdn"]').forEach(function(el) {
        images.push(normalizeUrl(el.attr("src")));
    });
    return Response.success(images);
}
```

---

## 💡 Triết lý cốt lõi của VBook Tool
> **"Hãy để Trình duyệt thực hiện công việc nặng nhọc, chúng ta chỉ lấy kết quả"**
> 
> Đây là lý do `Engine.newBrowser()` được sinh ra. Hãy tận dụng nó làm vũ khí tối thượng đối với các nguồn truyện/phim áp dụng các kỹ thuật mã hóa phức tạp.
