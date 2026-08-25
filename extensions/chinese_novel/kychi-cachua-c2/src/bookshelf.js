load("config.js");

function execute(url, page) {
    if (page && parseInt(page, 10) > 1) return Response.success([]);

    var response = fetch(url, {
        headers: { "User-Agent": BASE_UA, "Accept": "application/json" },
        timeout: 15000
    });

    if (!response || !response.ok) {
        return Response.error("Lỗi kết nối: HTTP " + (response ? response.status : "unknown"));
    }

    var json = SafeJson(response);
    if (!json) return Response.error("Lỗi phân tích dữ liệu");
    if (json.code !== 0) return Response.error("Chưa đăng nhập tài khoản Fanqie");

    var items = json.data || [];
    if (!Array.isArray(items) || items.length === 0) return Response.success([]);

    var bookIds = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i] && items[i].book_id) bookIds.push(String(items[i].book_id));
    }
    if (bookIds.length === 0) return Response.success([]);

    var results = [];
    var batchSize = 50;
    for (var s = 0; s < bookIds.length; s += batchSize) {
        var batch = bookIds.slice(s, s + batchSize);
        var r = fetch(FANQIE_URL + "/api/book/simple/info", {
            method: "POST",
            headers: { "User-Agent": BASE_UA, "Content-Type": "application/json" },
            body: JSON.stringify({ book_ids: batch }),
            timeout: 20000
        });
        if (r && r.ok) {
            var dj = SafeJson(r);
            if (dj && dj.code === 0 && dj.data && dj.data.bookList) {
                dj.data.bookList.forEach(function(b) {
                    if (b && b.book_id) {
                        results.push({
                            name: decodeText(b.book_name || ""),
                            author: decodeText(b.author || ""),
                            cover: b.thumb_url || "",
                            description: decodeText(cleanText(b.abstract || "")),
                            detail: decodeText(b.category || ""),
                            link: bookLink(b.book_id),
                            host: BASE_URL
                        });
                    }
                });
            }
        }
    }
    return Response.success(results);
}
