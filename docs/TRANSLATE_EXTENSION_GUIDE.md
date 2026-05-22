# vBook Translate Extension Development Guide

Tài liệu này hướng dẫn chi tiết cách phát triển một **Translate Extension** cho vBook. Translate Extension cho phép người dùng dịch nội dung truyện (đặc biệt là truyện chữ tiếng Trung, truyện tranh tiếng nước ngoài) sang Tiếng Việt bằng các dịch vụ dịch thuật bên thứ ba (Google, Baidu, DeepL, v.v.).

---

## 1. Cấu trúc thư mục

Một Translate extension cơ bản có cấu trúc như sau:

```text
extensions/translate/{author}_{name}/
├── plugin.json          # Metadata và cấu hình
├── icon.png             # Icon hiển thị (64x64 hoặc 128x128)
└── src/
    ├── language.js      # Script lấy danh sách ngôn ngữ hỗ trợ
    ├── language_list.js # (Tùy chọn) Chứa data ngôn ngữ tĩnh
    └── translate.js     # Script thực hiện dịch văn bản
```

---

## 2. Metadata Contract (`plugin.json`)

File `plugin.json` định nghĩa loại extension và các script tương ứng. 

Trường `type` bắt buộc phải là `"translate"`.

```json
{
  "metadata": {
    "name": "Tên Dịch Vụ Dịch",
    "author": "Tên bạn",
    "version": 1,
    "source": "https://example.com",
    "description": "Mô tả ngắn gọn về extension dịch",
    "locale": "vi_VN",
    "type": "translate"
  },
  "script": {
    "language": "language.js",
    "translate": "translate.js"
  },
  "config": {
    "support_auto_detect": true,
    "max_length": 5000,
    "required_api_key": false,
    "support_url": "https://example.com"
  }
}
```

### Các trường cấu hình (`config`)
- `support_auto_detect` (boolean): Có hỗ trợ tự động nhận diện ngôn ngữ nguồn hay không (chế độ `"auto"`).
- `max_length` (integer): Độ dài tối đa của văn bản gửi đi mỗi lần (giúp vBook tự động cắt nhỏ đoạn văn dài tránh lỗi API).
- `required_api_key` (boolean): Extension có yêu cầu người dùng nhập API key không.
- `api_keys` (object, tùy chọn): Cấu hình form nhập API key nếu `required_api_key` = true (tương tự các extension khác).

---

## 3. Language Contract (`language.js`)

Script này có nhiệm vụ trả về danh sách các ngôn ngữ (ngôn ngữ đích và ngôn ngữ nguồn) mà API hỗ trợ.

Hàm bắt buộc: `execute()`

```javascript
function execute() {
    var languages = [
        { id: "auto", name: "Tự động nhận diện" }, // Nếu support_auto_detect = true
        { id: "vi", name: "Tiếng Việt" },
        { id: "en", name: "Tiếng Anh" },
        { id: "zh-CN", name: "Tiếng Trung (Giản thể)" }
        // ...
    ];
    return Response.success(languages);
}
```
*Lưu ý:* Mã `id` (như "vi", "en") sẽ được vBook truyền vào hàm `execute` trong script dịch.

---

## 4. Translate Contract (`translate.js`)

Script này chứa logic gọi API dịch thuật bên thứ ba.

Hàm bắt buộc: `execute(text, from, to, apiKey)`

### Tham số đầu vào
- `text` (String): Đoạn văn bản cần dịch.
- `from` (String): Mã `id` của ngôn ngữ nguồn (ví dụ: `"auto"`, `"zh-CN"`, `"en"`).
- `to` (String): Mã `id` của ngôn ngữ đích (ví dụ: `"vi"`).
- `apiKey` (String, có thể null): Giá trị API key người dùng đã cấu hình (nếu `required_api_key` = true).

### Kết quả trả về
- **Thành công**: Trả về `Response.success(translated_text)` (String văn bản đã được dịch).
- **Thất bại**: Trả về `Response.error("Lỗi...")` hoặc `null` để vBook tự fallback/thông báo.

### Ví dụ mẫu (`translate.js`)

```javascript
function execute(text, from, to, apiKey) {
    if (!text || !text.trim()) return Response.error("Văn bản trống");

    // Lọc độ dài tối đa
    if (text.length > 5000) {
        text = text.substring(0, 5000);
    }

    var url = "https://api.example.com/translate";
    var payload = {
        q: text,
        source: from,
        target: to,
        key: apiKey
    };

    try {
        var response = fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            var data = response.json();
            // Tùy theo cấu trúc JSON trả về của API
            return Response.success(data.translatedText);
        }
    } catch (e) {
        return Response.error("Lỗi kết nối API: " + e.message);
    }
    
    return Response.error("Dịch thất bại");
}
```

---

## 5. Hỗ trợ Local Quick Translator (`Qt.translate`)

Nếu bạn đang viết một extension sử dụng engine dịch thuật local (Local Quick Translator Bridge) tích hợp sẵn trong vBook thay vì gọi API HTTP ngoài, bạn có thể gọi trực tiếp hàm native `Qt.translate()`.

### API Native
```javascript
var result = Qt.translate(text, to, extras);
```

### Tham số
- `text` (String): Văn bản nguồn.
- `to` (String): Mã ngôn ngữ đích hoặc chế độ dịch (ví dụ: `"vp"` - VietPhrase, `"hv"` - Hán Việt).
- `extras` (Object, tùy chọn): 
  - `first_line_chapter_name`: Dịch dòng đầu tiên như tên chương (boolean)
  - `chapter_name`: Dịch toàn bộ như tên chương (boolean)
  - `person_name`: Dịch như tên người (boolean)
  - `first_capitalize`: Viết hoa chữ cái đầu tiên (boolean)
  - `convert_simplified`: Chuyển đổi sang Trung Giản thể trước khi dịch (boolean)
  - `ner`: Bật Named-Entity Recognition (boolean)

### Kết quả trả về từ `Qt.translate`
Trả về Object JSON, hoặc `null` nếu có lỗi nội bộ.

```json
{
  "translateText": "văn bản đã dịch",
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

Trong script `translate.js`, bạn có thể bọc hàm này như sau:

```javascript
function execute(text, from, to) {
    try {
        var qtResult = Qt.translate(text, to, {
            first_capitalize: true,
            convert_simplified: true
        });
        
        if (qtResult && qtResult.translateText) {
            return Response.success(qtResult.translateText);
        }
    } catch (e) {
        // Fallback or handle error
    }
    return Response.error("Lỗi dịch Local Quick Translator");
}
```
