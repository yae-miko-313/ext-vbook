# vBook TTS Extension Development Guide

Tài liệu này hướng dẫn chi tiết cách phát triển một **TTS (Text-to-Speech) Extension** cho vBook. TTS Extension cho phép người dùng nghe nội dung truyện bằng các giọng đọc từ bên thứ ba (Google, Bing, Zalo, Tiktok, v.v.).

---

## 1. Cấu trúc thư mục

Một TTS extension cơ bản có cấu trúc như sau:

```text
extensions/tts/{author}_{name}/
├── plugin.json          # Metadata và cấu hình
├── icon.png             # Icon hiển thị (64x64 hoặc 128x128)
└── src/
    ├── voice.js         # Script lấy danh sách giọng đọc
    ├── voice_list.js    # (Tùy chọn) Chứa data giọng đọc tĩnh
    └── tts.js           # Script thực hiện chuyển đổi text -> audio
```

---

## 2. Metadata Contract (`plugin.json`)

File `plugin.json` định nghĩa loại extension và các script tương ứng.

```json
{
  "metadata": {
    "name": "Tên TTS Service",
    "author": "tên_author",
    "version": 1,
    "source": "https://example.com",
    "description": "Mô tả ngắn gọn về dịch vụ TTS",
    "type": "tts",
    "locale": "vi_VN"
  },
  "script": {
    "voice": "voice.js",
    "tts": "tts.js"
  },
  "config": {
    "preload_size": 3,
    "max_length": 200,
    "required_api_key": false,
    "support_url": "https://example.com/help",
    "api_keys": {
      "title": "API Key",
      "mode": "input",
      "format": "text"
    }
  }
}
```

### Các trường cấu hình đặc thù (`config`):
- `preload_size`: Số lượng câu vBook sẽ yêu cầu tải trước (mặc định nên để 3-5).
- `max_length`: Giới hạn ký tự tối đa cho mỗi yêu cầu (phụ thuộc vào API của service).
- `api_keys`: Nếu service yêu cầu key, cấu hình này sẽ hiển thị một ô nhập liệu trong phần cài đặt extension.

---

## 3. Voice Script Contract (`voice.js`)

Script này trả về danh sách các giọng đọc khả dụng.

- **Input**: Không có.
- **Output**: `Response.success(Array<VoiceObject>)`.

**Cấu trúc VoiceObject:**
- `id`: Định danh giọng đọc (dùng để gửi sang `tts.js`).
- `language`: Mã ngôn ngữ (ví dụ: `vi`, `en`, `zh`).
- `gender`: (Tùy chọn) `male` hoặc `female`.

**Ví dụ mẫu (`voice.js`):**
```javascript
function execute() {
    var voices = [
        { id: "vi-VN-Standard-A", language: "vi", gender: "female" },
        { id: "vi-VN-Standard-B", language: "vi", gender: "male" },
        { id: "en-US-Standard-C", language: "en", gender: "female" }
    ];
    return Response.success(voices);
}
```

---

## 4. TTS Script Contract (`tts.js`)

Đây là script quan trọng nhất, thực hiện gọi API để lấy dữ liệu âm thanh.

- **Input**: `(text, voice_id)`
    - `text`: Nội dung cần đọc.
    - `voice_id`: ID của giọng đọc được chọn (từ `voice.js`).
- **Output**: `Response.success(audio_data)`
    - `audio_data`: Thường là **Base64 string** của file audio (vBook Engine sẽ tự động decode và phát).

**Ví dụ mẫu (`tts.js` - Trả về Base64):**
```javascript
function execute(text, voice) {
    // 1. Chuẩn bị request
    var response = fetch("https://api.example.com/tts", {
        method: "POST",
        body: {
            text: text,
            voice: voice,
            format: "mp3"
        }
    });

    // 2. Xử lý kết quả
    if (response.ok) {
        // vBook hỗ trợ phương thức .base64() để lấy nội dung response dưới dạng base64
        return Response.success(response.base64());
    }

    return Response.error("Không thể lấy dữ liệu âm thanh");
}
```

---

## 5. Các API hữu ích

Khi viết TTS Extension, bạn có thể tận dụng các API hệ thống sau:

### Cache & Token
Dùng để lưu trữ token/session tránh việc fetch liên tục.
```javascript
// Lưu token trong 10 phút
cacheStorage.setItem("my_token", JSON.stringify({val: "...", time: Date.now()}));

// Lấy token
var cached = cacheStorage.getItem("my_token");
```

### Cookie từ trình duyệt
Nếu service yêu cầu đăng nhập trên trình duyệt trước (như Tiktok).
```javascript
var cookie = localCookie.getCookie();
if (!cookie.includes("sessionid=")) {
    return Response.error("Vui lòng đăng nhập trên trình duyệt");
}
```

### Xử lý Text
TTS thường gặp lỗi với các ký tự đặc biệt. Hãy làm sạch text trước khi gửi đi.
```javascript
var cleanText = text.replace(/[@^*()\\/\-_+=><]/g, " ");
```

---

## 6. Checklist khi Implement

1. [ ] **ES5 Syntax Only**: Tuyệt đối không dùng `const`, `let`, `arrow function`, `async/await`.
2. [ ] **Base64 Output**: Đảm bảo trả về chuỗi Base64 sạch (không kèm prefix `data:audio/...` trừ khi API yêu cầu).
3. [ ] **Error Handling**: Luôn kiểm tra `response.ok` và trả về `Response.error()` kèm thông báo rõ ràng.
4. [ ] **Max Length**: Đặt `max_length` hợp lý trong `plugin.json`. vBook sẽ tự động chia nhỏ các đoạn văn dài thành nhiều request dựa trên giá trị này.
