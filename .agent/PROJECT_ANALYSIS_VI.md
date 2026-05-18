# Project Analysis & Architecture Summary - MangaGo Extension

## Phân Tích Dự Án (Project Analysis)

### Hiện Tại Có 3 Loại Mã Hóa Trong Extensions (3 Encryption Types)

```
┌─────────────────────────────────────────────────────────────┐
│  ENCRYPTION PATTERNS IN VBook Extensions                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣  XOR CIPHER (kychi_quykhu)                              │
│     ├─ Loại: Text XOR + Base64                             │
│     ├─ Dòng luồng: HTML → tìm key → API → decrypt          │
│     ├─ Ưu điểm: Đơn giản, fallback có atob()               │
│     └─ Phương pháp: Base64 → nhị phân → XOR → UTF8        │
│                                                             │
│  2️⃣  DIRECT API (kychi_cachua)                              │
│     ├─ Loại: No encryption, Auth token                     │
│     ├─ Dòng luồng: POST → JSON response                    │
│     ├─ Ưu điểm: BEST - không cần giải mã                   │
│     └─ Phương pháp: Gọi API trực tiếp với credentials      │
│                                                             │
│  3️⃣  AES-256 CLIENT-SIDE (kychi_mangago) ⚠️                 │
│     ├─ Loại: AES-256-CBC với ZeroPadding                   │
│     ├─ Dòng luồng: HTML (var imgsrcs=Base64)               │
│     ├─ Vấn đề: Keys không tìm được trong HTML              │
│     └─ Phương pháp: JavaScript client decrypt              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tối Ưu Hóa Giải Mã (Optimal Decryption Strategy)

### Quy Tắc Ưu Tiên (Priority Ranking)

```
BEST    ✅✅✅  Direct API       → Không cần mã hóa, clear contract
        ✅✅   Browser Engine    → Để JS xử lý, lấy kết quả  
        ✅    Manual Crypto     → Nếu tìm được keys
WORST   ❌     Guess/Reverse     → Dễ vỡ, site changes break
```

### Cách Hoạt Động của VBook MangaGo

```
Bước 1: Fetch HTML
        ↓
Bước 2: Tìm <var imgsrcs = "Base64...">
        ↓
Bước 3: ❌ Thử giải mã manual
        ├─ Keys không hoạt động
        ├─ Không biết đúng algorithm
        └─ Không có keys trong HTML
        ↓
Bước 4: ✅ THAY VÌ: Render với Engine.newBrowser()
        ├─ Mangago's JavaScript tự động giải mã
        ├─ DOM có <img src="...decrypted...">
        └─ Extract IMG tags, done!
```

---

## Chi Tiết Phân Tích (Detailed Analysis)

### XOR Pattern (kychi_quykhu)

**Cách Mã Hóa**:
```javascript
plaintext = "https://example.com/img1.jpg,https://example.com/img2.jpg"
key = "abc123def456"
ciphertext = XOR(plaintext, repeating_key)
output = Base64(ciphertext)
```

**Cách Giải Mã**:
```javascript
// Bước 1: Tìm key từ HTML hoặc API
var xorKey = "abc123def456"

// Bước 2: Fetch từ API
var payload = fetch(endpoint) // { d: "base64", k: "key" }

// Bước 3: Decode
var binary = Base64.decode(payload.d)
var result = []
for (i = 0; i < binary.length; i++) {
    result[i] = binary[i] XOR key[i % key.length]
}
return UTF8(result)
```

**Ưu Điểm**:
- 👍 CryptoJS có sẵn không cần thêm library
- 👍 Fallback to atob() nếu không có CryptoJS
- 👍 Key search thông minh (multiple locations)

---

### Direct API Pattern (kychi_cachua)

**Cách Hoạt Động**:
```
Client → POST /api/content
  Body: { item_id, book_id, source, version, html, variable }
Server → Response: JSON { data: { content, text }, ... }
```

**Code Pattern**:
```javascript
var body = {
    item_id: 123,
    book_id: 456,
    source: "番茄",
    version: "5.3.2"
};

var response = fetch(BASE_URL + "/content", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" }
});

var json = JSON.parse(response.text());
return Response.success(json.data.content);
```

**Ưu Điểm**:
- 🏆 BEST: Không cần reverse-engineer
- 🏆 Clear API contract
- 🏆 No encryption keys needed
- 🏆 Bảo trì lâu dài

---

### AES-256 Client-Side (kychi_mangago Current Situation)

**Mã Hóa Hiện Tại**:
```
Website: var imgsrcs = "bG4U2JatwZNj8Bm6jyY+usQOWaU0tejwqeVwWDkC2ss..."
Type: Base64(AES-256-CBC encrypted)
IV: 1234567890abcdef1234567890abcdef
Padding: ZeroPadding
Key: ??? (NOT IN HTML)
```

**Vấn Đề**:
```
Thử 1: e11adc3949ba59abbe56e057f20f883e (MD5 "admin")  → ❌ FAIL
Thử 2: e10adc3949ba59abba56e057f20f883e (similar)      → ❌ FAIL
Thử 3: MD5(chapter_id)                                  → ❌ FAIL
Thử 4: SHA256(work_id)                                  → ❌ FAIL
```

**Kết Luận**: Keys không ở HTML → phải ở đâu đó:
1. ❓ JavaScript bundle (static file)
2. ❓ Generated at runtime
3. ❓ API endpoint
4. ❓ Local storage/IndexedDB

**BEST SOLUTION**: Không cần keys! 
```javascript
// Cách tối ưu:
var browser = Engine.newBrowser()
var page = browser.launch(url)  // JS tự decode
var imgs = page.select('img[src*="picgallery"]')  // Extracted already-decrypted URLs
return Response.success(extractURLs(imgs))
```

---

## Kiến Trúc Tối Ưu (Recommended Architecture)

### Pattern Chọn Tự Động

```javascript
load('config.js');
load('crypto.js');

function execute(url) {
    // STRATEGY 1: Try smart rendering (for JS-heavy sites)
    var doc = tryBrowserEngine(url, 15000, 'img[src]');
    if (doc && hasContent(doc)) {
        return extractFromDOM(doc);  // JS đã giải mã rồi
    }
    
    // STRATEGY 2: Try API (if available)
    var apiResponse = tryDirectAPI(url);
    if (apiResponse.ok) {
        return Response.success(apiResponse.data);
    }
    
    // STRATEGY 3: Manual parsing + crypto
    var html = fetchPage(url).text();
    var encrypted = extractVariable(html, 'imgsrcs');
    if (encrypted) {
        return decryptAndReturn(encrypted);
    }
    
    return Response.error('No data extraction method succeeded');
}

function tryBrowserEngine(url, timeout, selector) {
    if (Engine && Engine.newBrowser) {
        try {
            var browser = Engine.newBrowser();
            var page = browser.launch(url, timeout);
            var has = page.select(selector).length > 0;
            browser.close();
            if (has) return page;
        } catch(e) {}
    }
    return null;
}

function extractFromDOM(doc) {
    var results = [];
    var items = doc.select('img[src*="picgallery"]');
    for (var i = 0; i < items.length; i++) {
        results.push(normalizeUrl(items[i].attr('src')));
    }
    return Response.success(results);
}
```

---

## So Sánh 3 Phương Pháp (Comparison Table)

| Tiêu Chí | XOR (quykhu) | Direct API (cachua) | AES (mangago) |
|---------|-------------|------------------|--------------|
| **Thực Hiện** | Base64 + XOR | POST JSON | AES-256-CBC |
| **Keys Tìm** | ✅ HTML/API | N/A | ❌ Unknown |
| **CryptoJS** | ✅ Có | ❌ Không | ✅ Required |
| **Phức Tạp** | Trung bình | Đơn giản | Cao |
| **Độ Tin Cậy** | ✅ 80% | ✅✅ 95% | ❓ TBD |
| **Giải Pháp** | Manual decrypt | Call API | Browser render |

---

## Kết Luận & Khuyến Nghị (Conclusion & Recommendations)

### Cho VBook Tool Nói Chung

**Best Practice Hierarchy** (Quy Tắc Áp Dụng):

```
1️⃣  Nếu có API công khai
    └─ DÙNG TRỰC TIẾP → Response.success(apiData)

2️⃣  Nếu site dùng JavaScript render
    └─ DÙNG Engine.newBrowser() → extract from DOM

3️⃣  Nếu có mã hóa đơn giản (XOR, RC4)
    └─ Tìm keys → giải mã → parse

4️⃣  Nếu không có giải pháp nào
    └─ Yêu cầu user manual intervention
```

### Cho MangaGo Extension Cụ Thể

**Action Items**:

✅ **Bước 1** (DONE): Updated chap.js với Engine.newBrowser()
- Nếu thành công: Problem solved ✨
- Nếu thất bại: Continue to step 2

🔄 **Bước 2** (NEXT): Test trên OPPO device
- Chạy toc.js test (passed)
- Chạy chap.js test (để xem kết quả)

❓ **Bước 3** (IF NEEDED): Find keys in JS bundles
- Fetch /static/js/main.js, app.js, etc.
- Search patterns: `const KEY=`, `window.__key=`

🚀 **Bước 4** (FALLBACK): Alternative data source
- Kiểm tra mangago.zone API
- Hoặc dùng CDN service khác

---

## Tài Liệu Tham Khảo (Documentation)

📄 Xem chi tiết trong: **`.agent/ENCRYPTION_ANALYSIS.md`**

Bao gồm:
- Full code patterns với ví dụ
- Common pitfalls & solutions  
- Extension architecture templates
- VBook Runtime API reference
