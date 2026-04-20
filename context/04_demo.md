# 04_demo.md — Scripts & Plugin Reference

> Code examples for all script types. Core reference for implementation.
> **DO NOT use hardcoded selectors here** — use `mcp_vbook_inspect` to find real data.

---

## Directory Structure
```
ext-name/
├── plugin.json*
├── icon.png* (64x64)
├── src/
│   ├── config.js   (required — BASE_URL)
│   ├── detail.js*  (required)
│   ├── page.js*    (required — intermediary between detail and toc)
│   ├── toc.js*     (required)
│   ├── chap.js*    (required)
│   ├── track.js*    (required if type is video)
│   ├── home.js     (optional)
│   ├── genre.js    (optional)
│   ├── gen.js      (optional — generic list script for home/genre)
│   ├── search.js   (optional)
│   └── comment.js  (optional — if comments exist)
```

---

## plugin.json
```json
{
  "metadata": {
    "name": "Extension Name",
    "author": "B",
    "version": 1,
    "source": "https://domain.net",
    "regexp": "https?:\\/\\/(?:www\\.)?domain\\.net\\/truyen\\/[a-zA-Z0-9-]+\\/?$",
    "description": "Description",
    "locale": "vi_VN",
    "language": "javascript",
    "type": "novel", //video, comic, chinese_novel
    "tag": "nsfw"
  },
  "script": {
    "home": "home.js",
    "genre": "genre.js",
    "detail": "detail.js",
    "search": "search.js",
    "page": "page.js",
    "toc": "toc.js",
    "chap": "chap.js"
  }
}
```

**CRITICAL:**
- `regexp`: MUST match detail page ONLY (end with `\\/?$`)
- `script` paths: NO `src/` prefix
- `author`: read from `vbook-tool/.env`

---

## Data Flow Between Scripts

### Home / Genre Flow → Book List

```
home.js → execute()
  └─ returns [{title, input, script}]
       └─ gen.js → execute(url=input, page="")
            └─ returns [{name, link, cover, description, host}], next
                 └─ gen.js → execute(url=input, page=next)  ← loops until next=null
```

```
genre.js → execute()
  └─ returns [{title, input, script}]
       └─ gen.js → execute(url=input, page="")   ← same pattern as home
```

### Table of Contents Flow (Mandatory page.js intermediary)

```
detail.js → execute(url)
  └─ returns {name, cover, host, author, ...}

page.js → execute(url)          ← url = detail URL
  └─ returns [pageUrl1, pageUrl2, ...]
       ← If NO pagination: returns [url] (the detail URL itself)
       ← If HAS pagination: returns array of URLs for each TOC page

toc.js → execute(url)           ← url = each item from the array returned by page.js
  └─ returns [{name, url, host}]
       ← Each toc.js call = 1 TOC page
       ← App aggregates results from all calls

chap.js → execute(url)          ← url = chapter URL from toc.js
  └─ returns htmlString          ← Returns plain HTML string, NOT an object
```

### Search Flow

```
search.js → execute(key, page="")
  └─ returns [{name, link, cover, description, host}], next
       └─ search.js → execute(key, page=next)  ← loops until next=null
```

---

## Script Contracts

| Script | Signature | Input | Returns |
|--------|-----------|-------|---------|
| `home` | `execute()` | — | `[{title, input, script}]` |
| `genre` | `execute()` | — | `[{title, input, script}]` |
| `gen` | `execute(url, page)` | url from home/genre, page from next | `[{name*, link*, cover?, description?, host?}], next?` |
| `search` | `execute(key, page)` | key = keyword, page from next | `[{name*, link*, cover?, description?, host?}], next?` |
| `detail` | `execute(url)` | book detail URL | `{name*, cover, host, author, description, ongoing*, genres?, suggests?, comments?}` |
| `page` | `execute(url)` | detail URL | `[urlString, ...]` — always an array |
| `toc` | `execute(url)` | each item from page.js array | `[{name*, url*, host?}]` |
| `chap` | `execute(url)` | chapter URL from toc.js | `htmlString` |
| `comment` | `execute(input, next)` | from comments in detail | `[{name, content, description}], next?` |

**next** must always be a **string** or **null** — NEVER a number.

---

## config.js (Mandatory)
```js
// Use let (NOT const) so VBook can inject CONFIG_URL
let BASE_URL = "https://domain.net";
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch(e) {}
```

---

## home.js
```js
function execute() {
    // Returns tab list. "input" is URL for gen.js, {{page}} is auto-injected.
    // TODO: Update paths based on actual site structure
    return Response.success([
        { title: "Latest",    input: BASE_URL + "/PATH_LATEST/{{page}}", script: "gen.js" },
        { title: "Hot",       input: BASE_URL + "/PATH_HOT/{{page}}",    script: "gen.js" },
        { title: "Completed", input: BASE_URL + "/PATH_DONE/{{page}}",   script: "gen.js" },
        { title: "Genres",    input: BASE_URL + "/PATH_GENRES",          script: "genre.js" }
    ]);
}
```

> Use `{{page}}` in `input` for automatic pagination injection.

---

## genre.js
```js
function execute() {
    // TODO: Replace PATH_GENRES with actual genre list URL
    var res = fetch(BASE_URL + "/PATH_GENRES");
    if (!res.ok) return Response.error("Cannot load genres");

    var doc = res.html();
    var genres = [];

    // TODO: Selector for <a> tags of each genre link
    doc.select("SELECTOR_GENRE_LINKS").forEach(function(el) {
        var title = el.text() + "";
        var href  = (el.attr("href") || "") + "";
        if (!title || !href) return;
        if (!href.startsWith("http")) href = BASE_URL + href;
        genres.push({ title: title, input: href, script: "gen.js" });
    });

    return Response.success(genres);
}
```

---

## gen.js
```js
// Contract: execute(url, page) → [{name*, link*, cover?, description?, host?}], nextPage?
// CRITICAL: nextPage must be a string, not a number!
function execute(url, page) {
    if (!page) page = "1";

    // TODO: Adjust pagination pattern (replace {{page}}, or ?page=N, or /page/N)
    var pageUrl = url.replace("{{page}}", page);

    var res = fetch(pageUrl);
    if (!res.ok) return Response.error("Error: " + res.status);

    var doc = res.html();
    var data = [];

    // TODO: [1] Selector for each book container (e.g., .item, li, article)
    doc.select("SELECTOR_ITEM").forEach(function(el) {

        // TODO: [2] Selector for <a> tag containing name + link (inside container)
        var linkEl = el.select("SELECTOR_TITLE_LINK").first();

        // TODO: [3] Selector for <img> cover — prioritize data-src (lazy-load)
        var imgEl  = el.select("img").first();

        if (!linkEl) return;
        var link = (linkEl.attr("href") || "") + "";
        if (!link) return;
        if (!link.startsWith("http")) link = BASE_URL + link;

        var cover = imgEl ? ((imgEl.attr("data-src") || imgEl.attr("src") || "") + "") : "";
        if (cover.startsWith("//")) cover = "https:" + cover;

        data.push({
            name:        linkEl.text().trim() + "",
            link:        link,
            cover:       cover,
            description: "",
            host:        BASE_URL
        });
    });

    // TODO: [4] Selector to check for next page (a[rel=next], .pagination .next, etc.)
    var hasNext = doc.select("SELECTOR_NEXT_PAGE").size() > 0;
    var nextPage = hasNext ? String(parseInt(page) + 1) : null;

    return Response.success(data, nextPage);
}
```

---

## search.js
```js
// Contract: execute(key, page) → [{name*, link*, cover?, description?, host?}], next?
function execute(key, page) {
    if (!page) page = "1";

    // TODO: Adjust search URL and query params
    // Option 1: fetch(url, { queries: { q: key, page: page } })
    // Option 2: fetch(BASE_URL + "/search?q=" + encodeURIComponent(key) + "&page=" + page)
    var res = fetch(BASE_URL + "/PATH_SEARCH", {
        queries: { PARAM_KEYWORD: key, PARAM_PAGE: page }
    });
    if (!res.ok) return Response.error("Search failed: " + res.status);

    var doc = res.html();
    var data = [];

    // TODO: Selector same as gen.js
    doc.select("SELECTOR_ITEM").forEach(function(el) {
        var linkEl = el.select("SELECTOR_TITLE_LINK").first();
        var imgEl  = el.select("img").first();
        if (!linkEl) return;
        var link = (linkEl.attr("href") || "") + "";
        if (!link) return;
        if (!link.startsWith("http")) link = BASE_URL + link;
        var cover = imgEl ? ((imgEl.attr("data-src") || imgEl.attr("src") || "") + "") : "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        data.push({ name: linkEl.text().trim() + "", link: link, cover: cover, description: "", host: BASE_URL });
    });

    var hasNext = doc.select("SELECTOR_NEXT_PAGE").size() > 0;
    return Response.success(data, hasNext ? String(parseInt(page) + 1) : null);
}
```

---

## detail.js
```js
// Contract: execute(url) → { name*, cover, host, author, description, ongoing:bool*,
//                             genres?:[{title,input,script}], suggests?:[...], comments?:[...] }
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);
    var doc = res.html();

    // TODO: [1] Selector for book name (usually h1)
    var nameEl = doc.select("SELECTOR_TITLE").first();
    var name = (nameEl ? nameEl.text() : "") + "";

    // TODO: [2] Selector for cover <img> — prioritize data-src
    var coverEl = doc.select("SELECTOR_COVER_IMG").first();
    var cover = "";
    if (coverEl) {
        cover = (coverEl.attr("data-src") || coverEl.attr("src") || "") + "";
        if (cover.startsWith("//")) cover = "https:" + cover;
        if (cover && !cover.startsWith("http")) cover = BASE_URL + cover;
    }

    // TODO: [3] Selector for author (usually <a> or <span>)
    var authorEl = doc.select("SELECTOR_AUTHOR").first();
    var author = (authorEl ? authorEl.text() : "") + "";

    // TODO: [4] Selector for status ("Ongoing" / "Completed" / etc.)
    var statusEl = doc.select("SELECTOR_STATUS").first();
    var status = (statusEl ? statusEl.text() : "") + "";
    var ongoing = status.indexOf("Hoàn") === -1
               && status.indexOf("Completed") === -1
               && status.indexOf("Full") === -1
               && status.indexOf("完结") === -1;

    // TODO: [5] Selector for description container — use html() to keep formatting
    var descEl = doc.select("SELECTOR_DESCRIPTION").first();
    var description = (descEl ? descEl.html() : "") + "";

    // TODO: [6] Selector for genre <a> links
    var genres = [];
    doc.select("SELECTOR_GENRE_LINKS").forEach(function(el) {
        var gTitle = el.text() + "";
        var gHref  = (el.attr("href") || "") + "";
        if (!gTitle || !gHref) return;
        if (!gHref.startsWith("http")) gHref = BASE_URL + gHref;
        genres.push({ title: gTitle, input: gHref, script: "gen.js" });
    });

    var suggests = [];
    if (author) {
        suggests.push({ title: "Same Author: " + author, input: author, script: "search.js" });
    }

    // If using comment.js, uncomment below:
    // var comments = [{ title: "Comments", input: COMMENT_API_URL + "?page={{page}}", script: "comment.js" }];

    return Response.success({
        name:        name,
        cover:       cover,
        host:        BASE_URL,
        author:      author,
        description: description,
        ongoing:     ongoing,
        genres:      genres.length > 0 ? genres : undefined,
        suggests:    suggests.length > 0 ? suggests : undefined
        // comments: comments
    });
}
```

---

## page.js ← CRITICAL RULE

`page.js` is **mandatory** and acts as an **intermediary** between detail and toc.

- **If NO TOC pagination** → return array with one element (the detail URL)
- **If HAS TOC pagination** → return array of URLs for each TOC page
- App will call `toc.js` for each item in the returned array

```js
// CASE 1: No pagination — TOC is on the detail page itself
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    return Response.success([url]);
}

// CASE 2: TOC has pagination
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);
    var doc = res.html();

    var pages = [];
    // TODO: Selector for TOC pagination links
    // e.g., ".pagination a", "a[href*='page/']", ".page-list a"
    doc.select("SELECTOR_TOC_PAGINATION").forEach(function(el) {
        var href = (el.attr("href") || "") + "";
        if (!href || href.indexOf("#") > -1) return;
        if (!href.startsWith("http")) href = BASE_URL + href;
        if (pages.indexOf(href) === -1) pages.push(href);
    });

    if (pages.length === 0) return Response.success([url]);
    return Response.success(pages);
}
```

---

## toc.js
```js
// toc.js receives URL from page.js — each call handles one TOC page
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);
    if (url.slice(-1) === "/") url = url.slice(0, -1);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);
    var doc = res.html();
    var chapters = [];
    var seen = {};

    // TODO: Selector for chapter <a> links in TOC
    // e.g., "#list-chapter a", ".chapter-list a", ".ds-chap a"
    doc.select("SELECTOR_CHAPTER_LINKS").forEach(function(el) {
        var name    = el.text().trim() + "";
        var chapUrl = (el.attr("href") || "") + "";
        if (!name || !chapUrl || seen[chapUrl]) return;
        seen[chapUrl] = true;
        if (!chapUrl.startsWith("http")) {
            chapUrl = chapUrl.startsWith("/") ? BASE_URL + chapUrl : BASE_URL + "/" + chapUrl;
        }
        var isPaid = el.select(".vip, .paid, .lock").size() > 0;
        chapters.push({ name: name, url: chapUrl, host: BASE_URL, pay: isPaid || undefined });
    });

    if (chapters.length === 0) return Response.error("No chapters found");
    return Response.success(chapters);
}
```

---

## chap.js
```js
// chap.js returns plain HTML string directly — NOT an object!
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);
    var doc = res.html();

    // Remove ads before extracting content
    doc.select("script, style, ins, iframe, .ads, .advertisement, .banner").remove();

    // TODO: Selector for the chapter content container (novel text)
    // e.g., "#chapter-content", ".chapter-c", "#content", ".box-chap"
    var contentEl = doc.select("SELECTOR_CONTENT").first();
    if (!contentEl) return Response.error("No content found");

    var content = contentEl.html() + "";
    content = content.replace(/&nbsp;/g, " ");

    return Response.success(content);
}
```

---

## chap.js (Comic — returns images)
```js
// Comic: returns HTML containing <img> tags — VBook auto-parses for viewer
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);
    var doc = res.html();
    doc.select("script, style, .ads").remove();

    // TODO: Selector for the container holding all page images
    // e.g., ".chapter-content", "#chapter-images", ".reading-content"
    var container = doc.select("SELECTOR_IMAGE_CONTAINER").first();
    if (!container) return Response.error("No images found");

    // Resolve lazy-load: map data-src → src
    container.select("img[data-src]").forEach(function(img) {
        var s = img.attr("data-src") + "";
        if (s) img.attr("src", s);
    });

    return Response.success(container.html() + "");
}
```

---

## chap.js (Video — returns an array of tracks/servers)
```js
// Video: returns tracks (stream servers/iframes), VBook uses track.js to process them further
// Contract: execute(url) → [{ title*, data* }]
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);

    var res = fetch(url);
    if (!res.ok) return Response.error("Cannot load: " + res.status);
    var doc = res.html();
    var tracks = [];

    // TODO: Selector for the video iframe or stream link
    // e.g., ".server-list a", "iframe.player"
    doc.select("SELECTOR_VIDEO_STREAM").forEach(function(el) {
        var link = (el.attr("data-src") || el.attr("src") || "") + "";
        var title = el.text().trim() || "Server";
        if (link) {
            tracks.push({ title: title, data: normalizeUrl(link) });
        }
    });

    if (tracks.length === 0) return Response.error("No tracks found");
    return Response.success(tracks);
}
```

---

## track.js (Video Only — resolves final playback URL)
```js
// track.js receives `data` (from chosen track in chap.js) and returns final stream
// Contract: execute(url) → { data*, type*, headers?:Object, host?:string, timeSkip?:[{startTime, endTime}] }
// type: "native" (for direct mp4/m3u8), "auto" (for webview extraction of iframe logic)
function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/, BASE_URL);

    // If it's a direct media link, use "native" player
    if (url.indexOf(".mp4") !== -1 || url.indexOf(".m3u8") !== -1) {
        return Response.success({
            data: url,
            type: "native",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": BASE_URL + "/"
            },
            host: BASE_URL,
            timeSkip: []
        });
    }

    // If it relies on JS/iframe to decode the stream, use "auto" to let WebView intercept media requests
    return Response.success({
        data: url,
        type: "auto",
        headers: {
            "User-Agent": "Mozilla/5.0",
            "Referer": BASE_URL + "/"
        },
        host: BASE_URL,
        timeSkip: []
    });
}
```

---

## utils.js (Optional Helper)
```js
function normalizeUrl(url, base) {
    if (!url) return "";
    url = url + "";
    if (url.startsWith("//")) return "https:" + url;
    if (url.startsWith("/")) return base + url;
    if (!url.startsWith("http")) return base + "/" + url;
    return url;
}
```