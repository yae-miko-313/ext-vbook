# VBook Extension Analysis: Encryption & Decryption Patterns

## Project Overview

The vBook tool is a **JavaScript-based content scraper framework** that runs in a **Rhino JavaScript engine** (Java's JS runtime, not Node.js). It handles different content types (novels, comics, videos) with modular extensions that execute in a sandboxed environment.

---

## Core Encryption Patterns Found In-Project

### 1. **XOR Decryption Pattern** (kychi_quykhu - Novel)

**Use Case**: quykhu.com encrypts serialized novel chapters with XOR cipher

**Method**:
```
Encrypted: Base64 stored in API response
Format: { d: "base64_data", k: "xor_key" }
Decryption: Base64 → binary → XOR with repeating key → UTF8 string
```

**Key Strengths**:
- ✅ Fallback to native `atob()` if CryptoJS unavailable
- ✅ Handles both CryptoJS and browser APIs
- ✅ Uses `Engine.newBrowser()` for JavaScript extraction
- ✅ Searches multiple script locations for keys

**Code Pattern**:
```javascript
// 1. Extract from HTML or API
var keyMatch = rawHTML.match(/xor_?key\s*=\s*["']([^"']+)["']/i);

// 2. Load encrypted data from endpoint
var payloadResp = fetchPage(endpoint, { headers: {...} });
var payload = JSON.parse(payloadResp.text());

// 3. Decrypt: Base64 → XOR
var wa = CryptoJS.enc.Base64.parse(base64Text);
var raw = CryptoJS.enc.Latin1.stringify(wa);
for (var i = 0; i < raw.length; i++) {
    result.push(String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % keyLen)));
}
```

---

### 2. **Direct API Pattern** (kychi_cachua - Chinese Novel)

**Use Case**: Tomato Novel API doesn't use encryption - uses authentication tokens

**Method**:
```
POST /content with { item_id, book_id, source, version }
Response: JSON with data.content already decrypted
Auth: Optional qttoken cookie (auto-extracted if logged in)
```

**Key Strengths**:
- ✅ No encryption needed - API handles all security
- ✅ Simple, maintainable, reliable
- ✅ Good pattern for modern sites with proper APIs

**Takeaway**: Always prefer direct APIs over reverse-engineering encryption

---

### 3. **AES-256 Client-Side Pattern** (kychi_mangago - Comic / IN PROGRESS)

**Current Status**: ⚠️ **Encryption keys unknown** - investigation ongoing

**Findings**:
```
Variable: imgsrcs
Format: Base64-encoded AES-256-CBC ciphertext
Example: bG4U2JatwZNj8Bm6jyY+usQOWaU0tejwqeVwWDkC2ss...
IV: 1234567890abcdef1234567890abcdef (hardcoded in extension)
Padding: ZeroPadding
Key: NOT IN HTML - must be:
  1. In external JS bundle (not fetched)
  2. Generated client-side
  3. Embedded in separate script file
```

**Problem**: Previous key assumptions don't decrypt the data
- ❌ `e11adc3949ba59abbe56e057f20f883e` (MD5 "admin")
- ❌ Derived keys from chapter ID, work ID, URL
- ❌ MD5/SHA256 of various URL components

**Solution Approach**:
1. **USE BROWSER ENGINE** to let mangago's JavaScript decrypt automatically
   - `Engine.newBrowser()` → renders page with JS → extracts IMG tags
   - IMG tags already have decrypted URLs
2. **Fallback**: Manual decryption if keys found elsewhere

---

## Architectural Strategies by Content Type

| Type | Encryption | Best Approach | Fallback |
|------|-----------|---------|----------|
| **API-based** | None/Token | Direct API calls | Browser render |
| **XOR Protected** | XOR cipher | Extract key + decrypt | Browser engine |
| **AES Protected** | AES-256 | Browser render | Find keys in JS |
| **JavaScript Rendered** | Client-side | **USE BROWSER ENGINE** | None |

---

## VBook Runtime Capabilities

### Available APIs

```javascript
// HTTP Client
fetchPage(url, options)          // Returns { ok, status, text(), html() }
Response.success(data, data2)    // JSON response for chaining
Response.error(msg)              // Error response

// DOM/CSS Selectors (when using html() method)
doc.select('selector')           // jQuery-like selector
.first(), .last(), .attr(), .text(), .html()

// Browser Rendering (advanced)
Engine.newBrowser()              // Spawn real browser instance
browser.launch(url, timeout)     // Render JS, returns DOM doc
browser.close()                  // Clean up

// Utilities
load('filename.js')              // Load JS from same extension folder
normalizeUrl(), cleanText()      // Helper functions from config.js
```

### Execution Model

```
Extension Load → config.js loads first
              → Each module loads dependencies with load()
              → scripts execute in shared global scope
              → Final execute() returns Response via fetchPage
              → vBook chains responses for multi-step workflows
```

---

## Optimal Decryption Strategy

### Phase 1: Discovery
```javascript
// 1) Always try Browser Engine first
var doc = Engine.newBrowser().launch(url, 15000);

// 2) Extract data from DOM (JS has already processed it)
var images = doc.select('img[src*="cdn"]');  // Pre-encrypted images now visible
```

### Phase 2: Fallback to Manual Crypto
```javascript
// Only if no rendered DOM found:
// 1) Extract encrypted variable from HTML
var match = html.match(/var encrypted = ["']([^"']+)["']/);

// 2) Load crypto library
load('crypto.js');  // Must be in same folder as this script

// 3) Decrypt with identified key
var plaintext = CryptoJS.AES.decrypt(
    CryptoJS.enc.Base64.parse(ciphertext),
    CryptoJS.enc.Hex.parse(keyHex),
    { iv, padding, mode }
);
```

### Phase 3: Key Extraction (Last Resort)
```javascript
// If encryption key not in page HTML:
// 1) Fetch external JS bundles
// 2) Search for patterns like:
//    const KEY = "abc123"
//    window.__key = 
//    .env files

// 2) Check multiple locations:
//    - <script src="app.js">
//    - API response headers
//    - Inline <script> blocks in HTML
```

---

## Common Pitfalls & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| **CryptoJS undefined** | Library didn't load | Use `try { load() } catch` or check if available |
| **Empty decrypt result** | Wrong key/mode/padding | Test with browser engine first |
| **Can't find encrypted data** | Data not in HTML | Use browser engine to render JS |
| **Wrong encoding** | Assuming UTF8 when it's Latin1 | Try `.toString(CryptoJS.enc.Latin1)` |
| **Key format mismatch** | Key is Base64, trying Hex | Parse with correct encoding first |

---

## Recommended Extension Architecture

```javascript
load('config.js');     // Always first, has helpers
load('crypto.js');     // If using crypto

function execute(url) {
    // 1. Try smart method (browser render)
    var doc = loadDocument(url, 15000, 'img[src]');
    if (doc && doc.select('img[src]').length > 0) {
        return extractImagesFromDOM(doc);
    }
    
    // 2. Fallback to manual parsing
    var html = fetchPage(url).text();
    var encrypted = extractFromHTML(html);
    var decrypted = decryptIfNeeded(encrypted);
    return Response.success(parseResults(decrypted));
}

function loadDocument(url, timeout, selector) {
    // Try HTML first
    var response = fetchPage(url);
    var doc = response.html();
    if (doc && doc.select(selector).length > 0) return doc;
    
    // Fall back to browser (JS-heavy pages)
    if (Engine && Engine.newBrowser) {
        var browser = Engine.newBrowser();
        try {
            return browser.launch(url, timeout);
        } finally {
            if (browser.close) browser.close();
        }
    }
    return null;
}
```

---

## Next Steps for kychi_mangago

1. **Test current chap.js** with `Engine.newBrowser()` approach
   - See if rendered page has `<img>` tags with decrypted URLs
   - If yes ✅ → Solution doesn't need encryption keys
   - If no ❌ → Need to find where JS decrypts

2. **If manual decryption needed**:
   - Inspect mangago's frontend source code in production
   - Check browser DevTools Network: where do image URLs come from?
   - Search browser local storage for cached keys
   - Check if API endpoint exists to get image list

3. **Alternative: Use intermediate service**
   - mangago might have a CDN API or proxy endpoint
   - Call that instead of decrypting manually

---

## Key Lessons from Project

**Pattern Hierarchy** (by reliability):
1. ✅✅✅ **Direct API** - Most reliable, clearest code
2. ✅✅ **Browser Render + DOM Extract** - Works for any JS-rendered site
3. ✅ **Manual Crypto** - Requires finding/verifying keys
4. ❌ **Guess/Reverse Encrypt** - Fragile, site changes break it

**VBook Design Principle**:
> "Let the browser do the work, then scrape the results"

This is why `Engine.newBrowser()` exists - it's the most robust solution for modern sites.
