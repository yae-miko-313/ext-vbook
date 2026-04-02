# 🤖 AI Guide for VBook Extension Development

This document provides instructions for AI agents on how to develop and test VBook extensions efficiently using the available tools and documentation.

## 📚 Core References

1. **Coding Rules**: Read VBOOK CTX, vbook_demo.md.
2. **CLI Testing**: Read [README.md](../vbook-tool/README.md) for `vbook` commands (`test-all`, `debug`, `install`).

---

## 🛠 AI Development Workflow

When asked to create or fix an extension, follow these steps:

### Phase 1: Research & "Cracking"
- **Analyze Website**: Use `read_url_content` or `browser` tools to understand the target website's HTML structure and data loading (XHR, Next.js fragments, etc.).
- **Isolate Logic**: Prototype the extraction logic (RegEx, Selectors) outside of the vBook environment first if necessary, but keep Rhino constraints in mind.

### Phase 2: Implementation (Follow vbook_ctx.md)
- **Files**: Create `plugin.json`, **`icon.png` (mandatory, download from the website)**, and source files in `src/` (`home.js`, `detail.js`, `toc.js`, `chap.js`).
- **Constraint Check**: Ensure NO `async/await`, NO `...spread`, and proper `Response.success` usage.
- **Normalization**: Always normalize URLs and handle encoding (e.g., `gbk` for Chinese sites).

### Phase 3: Automated Testing
- **Setup**: Ensure `.env` has the correct `VBOOK_IP` and `LOCAL_PORT`.
- **Execute**: Use the `vbook` CLI tool to verify logic:
  ```bash
  vbook test-all           # Run full flow test
  vbook debug src/chap.js  # Test specific script with --input URL
  ```
- **Log Analysis**: Monitor `[LOG FROM DEVICE]` and `[EXCEPTION FROM DEVICE]` in the terminal output to fix errors occurring on the mobile device.

### Phase 4: Packaging
- Once verified, use `vbook build` to generate the final `plugin.zip`.

---

## ⚠️ Common Issues & Troubleshooting

- **`ReferenceError: server is not defined`**: Ensure `server` is declared with `let` outside the `try` block in the CLI tool actions.
- **`data2: "NaN"`**: Occurs when the `next` parameter in `Response.success(data, next)` is not a valid string number. Always initialize `page` and ensure `parseInt` succeeds:
  ```javascript
  let nextPage = String(parseInt(page || '1') + 1);
  ```
- **`gen.js` returned no data**: Check if the home page uses different selectors for list blocks vs. dedicated list pages. Prefer dedicated list URLs (e.g., `/danh-sach/truyen-hot/`) for better reliability.
- **`ClassCastException: UniqueTag cannot be cast to Function`**: This happens if you name the main function `home()`, `gen()`, `detail()`, etc. **ALL Javascript files (`home.js`, `gen.js`, `search.js`, `detail.js`, `toc.js`, `chap.js`) MUST export exactly ONE function named `function execute(...)`.** Do NOT name the function after the file. The entry point is ALWAYS `execute()`.

- **Character Obfuscation**: Some sites replace characters (e.g., `đ**m` for `đám`). Use a `cleanContent` helper in `chap.js` with Regex replacements.
- **Shared Utilities**: Use a `src/utils.js` for common parsing logic (e.g., `parseNovelList`). Both `gen.js` and `search.js` should `load('utils.js')` to maintain consistency.
- **Jsoup API**: Remember that `.first()` returns a single `Element` (check for null), while `.select()` returns `Elements` (use `.size() > 0` or `.isEmpty()`).
- **Redirects in Search**: Sites often redirect direct matches to the detail page. Detection: `if (doc.select("h1, .entry-title").size() > 0 && doc.select(".entry-content").size() > 0)`.

## 💡 Pro Tips for AI
- **Use `vbook test-all` First**: This is the fastest way to verify the entire extension logic in one go.
- **Enrich the Detail UI (`detail.js`)**: ALWAYS populate the optional `genres` (for clickable tags) and `suggests` (for "Cùng tác giả" or related books) arrays in the `detail(url)` response if the website provides categories or author names. Map their `script` to `"gen.js"` (if pushing a URL) or `"search.js"` (if pushing a keyword) to massively improve user experience.
- **Robust Selectors**: Sites often change structure. Use multiple selectors in `doc.select()` (e.g. `.row, .item, .col-truyen-main .row`) to increase resilience.
- **Track Layout Changes**: When an existing extension suddenly breaks (e.g., "Home page error"), verify if the target site dropped custom classes (like `.dx-title`) in favor of simplified tags (like `h3` or `h4`). Use plain tag selectors where possible for better longevity.
- **Browser Tool**: Use the browser tool to double-check selectors if `read_url_content` is unclear.

---

## 📈 Guide Self-Evolution
**Every time** you create a new extension or fix a bug, you **MUST** update this document with:
1. **New Tips**: Any "Aha!" moments or shortcuts discovered.
2. **Repeating Logic**: Common patterns for specific site types (e.g. Next.js, Cloudflare).
3. **Hard-learned Lessons**: Bugs discovered during verification (like the `server` scope issue).

This ensures every task makes the AI faster and better for the next one.


## VBOOK_CTX
# vBook Extension — AI Context (Rhino 1.7.14 / ~42% ES6)

## RUNTIME CONSTRAINTS (Rhino 1.7.14)
SUPPORTED: var/let/const, arrow functions, template literals, for..of, destructuring (basic), Promise (basic), class, Map/Set, Symbol, WeakMap, generator function*, shorthand methods, computed property names
UNSUPPORTED — DO NOT USE:
- Spread in function calls: Math.max(...arr) ✗ → Math.max.apply(null,arr) ✓
- Spread in array literals: [...arr] ✗ → arr.slice() / [].concat(arr) ✓
- Default function parameters: function f(a=1) ✗ → a = a===undefined?1:a ✓
- async/await ✗ → synchronous only
- Optional chaining: obj?.prop ✗ → obj && obj.prop ✓
- Nullish coalescing: a??b ✗ → a!=null?a:b ✓
- Array destructuring rest: [a,...rest] ✗
- import/export ✗ → use load("file.js")
- String.matchAll ✗ → use exec() in loop
- Promise.allSettled / Promise.any ✗
SAFE ES6: let/const, `template ${literals}`, ()=>, for..of, {a,b} shorthand, [key] computed, class, Map, Set, Symbol, rest params ...args in function def ✓ (but not spread call)

---

## DIRECTORY
```
ext-name/plugin.json*, icon.png*(64x64), src/detail.js*, src/toc.js*, src/chap.js*
optional: src/home.js, src/genre.js, src/gen.js, src/search.js, src/page.js
(* = required)
```

## PLUGIN.JSON
```json
{
  "metadata": {
    "name":"", "author":"", "version":1, "source":"https://",
    "regexp":"escaped\\.domain\\.com/truyen/.*", 
    "description":"", "locale":"vi_VN|zh_CN|en_US",
    "language":"javascript",
    "type":"novel|comic|chinese_novel|translate|tts",
    "tag":"nsfw"
  },
  "script": {
    "home":"home.js", "genre":"genre.js", "detail":"detail.js",
    "search":"search.js", "page":"page.js", "toc":"toc.js", "chap":"chap.js"
  }
}
```
**CRITICAL `plugin.json` RULES:**
1. **`regexp`**: MUST be a regex that matches the *detail page URL* ONLY (not the root domain, nor the chapter URLs). Example: `domain\\.com/truyen/[^/]+/?$`. It MUST use strict end anchors like `[^/]+/?$` to prevent accidentally matching subpaths like `domain.com/truyen/abc/chapter-1`.
2. **`script`**: The file paths MUST ONLY be the filenames (e.g., `"home": "home.js"`), do NOT include the `src/` directory prefix!
3. **`author`**: MUST read the `.env` file in the `vbook-tool` directory to find the `author=` value, and use it here.
Omit any script key not used. `tag` only if 18+.

---

## SCRIPT CONTRACTS

```
home()           → [{title, input, script}]
genre()          → [{title, input, script}]
gen(url, page)   → [{name*, link*, cover?, description?, host?}], nextPage?
search(key,page) → [{name*, link*, cover?, description?, host?}], nextPage?
detail(url)      → {name*, cover, host, author, description, detail, ongoing:bool*,
                     genres?:[{title,input,script}],
                     suggests?:[{title,input,script}],
                     comments?:[{title,input,script}]}
page(url)        → [urlString, ...]
toc(url)         → [{name*, url*, host?}]
chap(url)        → htmlString
comment(input,next) → [{name, content, description}], nextCursor?
translate(text,from,to) → string
tts(text,lang,voice)    → {audioUrl, text, language}
```

---

## RETURN API
```js
Response.success(data)          // single value
Response.success(data, next)    // data + next (next MUST be string, never number)
Response.error("message")
```

---

## HTTP API
```js
fetch(url)
fetch(url, {method:"POST", headers:{}, body:""})
// body as JSON string: body: JSON.stringify({})
// body as form:        body: "a=1&b=2"

res.ok / res.status
res.headers["set-cookie"] / res.request.headers.cookie
res.html() / res.html("gbk") / res.text() / res.text("gbk") / res.json() / res.base64()

Http.get(url).headers({}).queries({}).html()
Http.post(url).headers({}).body("").string()
```

---

## DOM API (jsoup)
```js
Html.parse(str) → doc
doc.select("css")           // standard CSS + jsoup extensions:
                            // :contains(text), :has(tag), :eq(n), :lt(n), :gt(n)
                            // a[href~=regex], div:matches(regex)
el.text() / el.html() / el.attr("name") / el.outerHtml()
el.first() / el.last() / el.get(i) / el.size() / el.length
el.select("css") / el.remove()
elements.forEach(fn) / elements.map(fn)
```

---

## BROWSER API
```js
var b = Engine.newBrowser()
b.setUserAgent(UserAgent.android|chrome|ios|system)
b.launch(url, timeoutMs)    // sync
b.launchAsync(url)          // async, use sleep() after
b.callJs(script, waitMs)
b.waitUrl([patterns], ms)
b.block([patterns])
b.getVariable("name")
b.loadHtml(str, ms)
b.html() → doc / b.urls() / b.close()   ← always close!
```

---

## UTILITIES
```js
Console.log(v)          // = Log.log = console.log
sleep(ms)
load("file.js")         // from src/ or URL
Html.clean(str, ["div","p"])
localCookie.setCookie("k=v") / localCookie.getCookie()
localStorage.getItem/setItem  // persistent, max 5MB, wrap in try/catch
Script.execute(code, funcName, param)
Graphics.createCanvas(w,h) / Graphics.createImage(base64)
WebSocket(url, options)
```

---

## CRITICAL RULES
1. nextPage → always string: `String(parseInt(page)+1)` not `parseInt(page)+1`
2. App strips trailing `/` from input URLs — re-add if script needs it
3. Chinese sites: `res.html("gbk")` or `res.text("gbk")`
4. Always `browser.close()` — never skip
5. Normalize all URLs: `//x` → `https://x`, `/path` → `base+path`, relative → `base/`+path
6. `chap.js` returns plain HTML string, not object
7. `ongoing`: true=ongoing, false=completed
8. No async/await — all I/O is synchronous
9. Spread call unsupported: use `.apply()` or loop instead
10. Default params unsupported: use `a = a !== undefined ? a : default` pattern
