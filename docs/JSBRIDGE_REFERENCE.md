# 📚 Tài liệu Tra cứu API vBook JSBridge (Master Reference)

Tài liệu này chứa thông tin tra cứu toàn bộ các hàm API, các đối tượng hệ thống (Bridge) và các thư viện mã hóa được cung cấp sẵn trong môi trường thực thi kịch bản (Script Environment) của vBook.

---

## ⚡ Ràng buộc Runtime (Rhino Environment)

> [!IMPORTANT]
> Toàn bộ script chạy trong môi trường **Rhino (Java/Android)** hỗ trợ tiêu chuẩn cú pháp **ES5 cổ điển**. 
> * **KHÔNG DÙNG** `const`, `let`, `arrow functions`, `async/await`, `Promise`, `?.`, `??`.
> * Luôn sử dụng `var` và viết hàm truyền thống.

---

## 📂 1. Network & HTTP Client

vBook cung cấp cả API cấp thấp (`fetch`) và API bao bọc cấp cao (`Http`) tiện dụng.

### A. Hàm `fetch(url, options)` cấp thấp
Trả về một đối tượng `HttpResponse`.

* **Cú pháp**: `fetch(url, options)`
* **Options Object**:
  * `method` (String): `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`.
  * `headers` (Object): Tiêu đề HTTP (ví dụ: `{"User-Agent": "..."}`).
  * `body` (String / Object): Dữ liệu gửi đi cho phương thức POST/PUT.
  * `queries` (Object): Các tham số truy vấn trên URL.
  * `timeout` (Integer): Thời gian chờ tối đa (mili giây).
  * `cache` (Integer): Thời gian lưu cache phản hồi (giây).

* **Đối tượng `HttpResponse`**:
  * `.ok` (Boolean): Trả về `true` nếu mã trạng thái từ `200` đến `299`.
  * `.status` (Integer): Mã phản hồi HTTP (ví dụ: `200`, `403`, `500`).
  * `.text()` (String): Trả về nội dung phản hồi dạng văn bản.
  * `.html()` (HtmlElement): Phân tích cú pháp và trả về đối tượng DOM cấp cao.
  * `.json()` (Object): Chuyển đổi nội dung phản hồi thành đối tượng JSON.
  * `.base64()` (String): Trả về nội dung phản hồi dưới dạng chuỗi Base64 (hữu ích cho TTS/Audio).

### B. Lớp bao bọc `Http` cấp cao (High-level Wrapper)
Cung cấp cú pháp chuỗi (chaining method) chuyên nghiệp:

* `Http.get(url).headers(obj).queries(obj).string(charset)`
* `Http.post(url).body(data).string(charset)`

---

## 🔍 2. Phân tích HTML DOM (Jsoup Wrapper)

vBook tích hợp bộ thư viện Jsoup giúp phân tích cú pháp HTML thông qua các selector giống như jQuery.

### A. Khởi tạo
```javascript
var doc = Html.parse(htmlString);
```

### B. Đối tượng `HtmlElement` (Một phần tử)
* `.select(query)`: Tìm kiếm và trả về danh sách các phần tử con (`HtmlElements`) khớp với CSS Selector `query`.
* `.attr(name)`: Lấy giá trị của thuộc tính `name` (ví dụ: `src`, `href`).
* `.text()`: Lấy toàn bộ nội dung văn bản bên trong phần tử (đã làm sạch).
* `.html()`: Lấy mã HTML bên trong phần tử.
* `.remove()`: Xóa phần tử này khỏi cây DOM.

### C. Đối tượng `HtmlElements` (Danh sách phần tử)
* `.size()` hoặc `.length`: Trả về số lượng phần tử trong danh sách.
* `.first()` / `.last()` / `.get(index)`: Truy cập các phần tử tương ứng.
* `.forEach(callback)`: Duyệt qua từng phần tử.
  ```javascript
  doc.select(".chapter a").forEach(function(el) {
      Log.log(el.text());
  });
  ```
* `.map(callback)`: Chuyển đổi danh sách.

---

## 🌐 3. Headless Browser (`Engine.newBrowser`)

Để bóc tách thông tin từ các trang web phức tạp render hoàn toàn bằng Client-side JS, hoặc được bảo vệ bởi Cloudflare, hãy sử dụng Headless Browser.

### A. Các hàm API chính
* `var browser = Engine.newBrowser()`: Khởi tạo một phiên trình duyệt ngầm.
* `browser.setUserAgent(ua)`: Thiết lập chuỗi User-Agent giả lập.
* `var page = browser.launch(url, timeout)`: Mở URL và trả về đối tượng `HtmlElement` sau khi trang đã render xong JavaScript.
* `browser.loadHtml(baseUrl, html)`: Tải trực tiếp mã HTML thô.
* `browser.callJs(script, timeout)`: Thực thi trực tiếp một đoạn mã JS trên môi trường trang web và nhận về kết quả.
* `browser.close()`: **BẮT BUỘC** gọi ở cuối để giải phóng tài nguyên hệ thống, tránh rò rỉ bộ nhớ gây chậm thiết bị.

---

## 💾 4. Lưu trữ & Trạng thái (Storage & State)

* **`localStorage`**: Lưu trữ dữ liệu vĩnh viễn (giống Web API thông thường).
  * `.setItem(key, value)`
  * `.getItem(key)`
  * `.removeItem(key)`
* **`cacheStorage`**: Lưu trữ dữ liệu tạm thời (có thể bị hệ thống giải phóng khi thiếu dung lượng). Sử dụng tương tự `localStorage`.
* **`localCookie`**: Quản lý Cookie lưu giữ phiên làm việc của nguồn.
  * `.setCookie(value)`
  * `.getCookie()`

---

## 🔐 5. Thư viện Crypto Bridge (Native CryptoJS)

> [!NOTE]
> Bản Crypto Bridge này gọi trực tiếp các hàm mã hóa chuẩn của hệ điều hành bên dưới (Kotlin/Java), cho tốc độ xử lý nhanh hơn gấp hàng chục lần so với việc chạy code JS CryptoJS thuần.

Để sử dụng, luôn nạp thư viện ở đầu script:
```javascript
load("crypto.js");
```

### A. Các hàm băm (Hash)
Mặc định trả về chuỗi Hex khi gọi `.toString()`.

| Thuật toán | Cú pháp |
| :--- | :--- |
| **MD5** | `CryptoJS.MD5(data).toString()` |
| **SHA1** | `CryptoJS.SHA1(data).toString()` |
| **SHA256** | `CryptoJS.SHA256(data).toString()` |
| **SHA512** | `CryptoJS.SHA512(data).toString()` |

### B. Các hàm HMAC
Sử dụng khi cần băm kèm theo một khóa bí mật (Secret Key).

* `CryptoJS.HmacMD5(data, key).toString()`
* `CryptoJS.HmacSHA256(data, key).toString()`

### C. Mã hóa & Giải mã AES (Mạnh nhất)
* **Mã hóa (Encrypt)**:
  ```javascript
  var encrypted = CryptoJS.AES.encrypt("Nội dung cần mã hóa", "Secret_Key", {
      iv: CryptoJS.enc.Hex.parse("16_ky_tu_hex_iv"), // Bỏ qua nếu không dùng IV
      mode: CryptoJS.mode.CBC, // CBC (Mặc định), ECB, CFB, OFB, CTR
      padding: CryptoJS.pad.Pkcs7 // Pkcs7 (Mặc định), NoPadding, ZeroPadding
  }).toString();
  ```
* **Giải mã (Decrypt)**:
  ```javascript
  var bytes = CryptoJS.AES.decrypt(encryptedStr, "Secret_Key", {
      iv: CryptoJS.enc.Hex.parse("16_ky_tu_hex_iv"),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
  });
  var decryptedText = bytes.toString(CryptoJS.enc.Utf8);
  ```

### D. Bộ chuyển đổi định dạng (Encoders)
Dùng để chuyển đổi giữa chuỗi văn bản thông thường và các định dạng mã hóa:

| Định dạng | Chuỗi -> Đối tượng (Parse) | Đối tượng -> Chuỗi (Stringify) |
| :--- | :--- | :--- |
| **Base64** | `CryptoJS.enc.Base64.parse(str)` | `CryptoJS.enc.Base64.stringify(obj)` |
| **Hex** | `CryptoJS.enc.Hex.parse(str)` | `CryptoJS.enc.Hex.stringify(obj)` |
| **Utf8** | `CryptoJS.enc.Utf8.parse(str)` | `CryptoJS.enc.Utf8.stringify(obj)` |

---

## 🌐 6. Local Quick Translator Bridge (`Qt.translate`)

Nếu extension cần thực hiện dịch tự động bằng bộ dịch cục bộ Quick Translator tích hợp sẵn trong máy của vBook, sử dụng hàm:

```javascript
var result = Qt.translate(text, to, extras);
```

### A. Tham số đầu vào:
* `text` (String): Văn bản tiếng Trung thô cần dịch.
* `to` (String): Mã ngôn ngữ hoặc chế độ dịch (ví dụ: `"vp"` - dịch VietPhrase, `"hv"` - dịch Hán Việt).
* `extras` (Object, tùy chọn):
  * `first_line_chapter_name` (Boolean): Coi dòng đầu tiên là tên chương.
  * `chapter_name` (Boolean): Coi toàn bộ đầu vào là tên chương.
  * `person_name` (Boolean): Dịch đầu vào như tên người.
  * `first_capitalize` (Boolean): Viết hoa ký tự đầu tiên của câu sau dịch.
  * `convert_simplified` (Boolean): Tự động chuyển đổi sang chữ Giản thể.
  * `ner` (Boolean): Bật Named-Entity Recognition nhận diện thực thể.

### B. Kết quả trả về:
Trả về một đối tượng chứa văn bản đã dịch hoặc `null` nếu lỗi:
```json
{
  "translateText": "Văn bản đã dịch hoàn chỉnh",
  "segments": [
    {
      "srcStart": 0,
      "srcLen": 4,
      "transStart": 0,
      "transLen": 6,
      "type": 1
    }
  ]
}
```

---

## 🛠️ 7. Các tiện ích khác

* **`Log.log(msg)`** / **`Console.log(msg)`**: Ghi nhật ký hiển thị trên màn hình gỡ lỗi của ứng dụng vBook.
* **`sleep(ms)`**: Tạm dừng luồng thực thi trong một khoảng thời gian (mili giây).
* **`UserAgent`**: Các chuỗi User-Agent thông dụng:
  * `UserAgent.chrome()`
  * `UserAgent.ios()`
  * `UserAgent.android()`
* **`Script.execute(scriptName, functionName, input)`**: Gọi thực thi chéo một hàm trong script khác cùng thuộc extension.
