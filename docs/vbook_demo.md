# vBook Demo Snippets

Snippet ngắn để tham khảo nhanh khi viết extension.

## home.js

```javascript
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/latest", script: "gen.js" }
    ]);
}
```

## gen.js

```javascript
function execute(url, page) {
    if (!page) page = "1";
    var response = fetch("https://example.com" + url + "?page=" + page);
    if (!response.ok) return null;

    var doc = response.html();
    var data = [];
    doc.select(".item").forEach(function (e) {
        data.push({
            name: e.select(".title").text(),
            link: e.select("a").attr("href"),
            cover: e.select("img").attr("src"),
            description: e.select(".desc").text(),
            host: "https://example.com"
        });
    });

    var next = doc.select(".next").attr("href");
    return Response.success(data, next || null);
}
```

## detail.js

```javascript
function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;

    var doc = response.html();
    return Response.success({
        name: doc.select("h1").text(),
        cover: doc.select(".cover img").attr("src"),
        author: doc.select(".author").text(),
        description: doc.select(".summary").text(),
        detail: doc.select(".meta").html(),
        host: "https://example.com"
    });
}
```

## toc.js

```javascript
function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;

    var doc = response.html();
    var data = [];
    doc.select(".chapter-list a").forEach(function (e) {
        data.push({
            name: e.text(),
            url: e.attr("href"),
            host: "https://example.com"
        });
    });
    return Response.success(data);
}
```

## chap.js

```javascript
function execute(url) {
    var response = fetch(url);
    if (!response.ok) return null;

    var doc = response.html();
    var html = doc.select(".chapter-content").html();
    return Response.success(html);
}
```
