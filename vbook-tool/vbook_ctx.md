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
    "regexp":"escaped\\.domain\\.com",
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
