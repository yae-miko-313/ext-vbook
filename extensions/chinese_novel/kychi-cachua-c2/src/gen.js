load("config.js");

function execute(url, page) {
    if (!page) page = "1";
    var targetUrl = url.replace("{{page}}", page);

    var response = fetchPage(targetUrl, { timeout: 20000, cache: 300 });

    if (!response || !response.ok) {
        return Response.error("Lỗi tải danh sách (HTTP " + (response ? response.status : "unknown") + ")");
    }

    var json = SafeJson(response);
    var list = [];

    if (json && json.data) {
        var bookList = json.data.book_list || json.data.bookList || json.data.list;
        if (bookList && Array.isArray(bookList)) {
            bookList.forEach(function(b) {
                var bookId = b.book_id || b.bookId || b.id;
                var name = b.book_name || b.title || "";
                if (!name || !bookId) return;

                var cat = decodeText(b.category || "");
                var score = b.score ? "\u2B50" + b.score : "";
                // creation_status: 0 = 已完结, 1 = 连载中
                var done = (b.creation_status === 0 || b.creation_status === "0") ? "\u5B8C\u7ED3" : "";
                var detail = [cat, score, done].filter(Boolean).join(" ");

                list.push({
                    name: decodeText(name),
                    author: decodeText(b.author || ""),
                    cover: b.thumb_url || "",
                    description: decodeText(cleanText(b.abstract || "")),
                    detail: detail,
                    link: bookLink(bookId),
                    host: BASE_URL
                });
            });
        }
    }

    var next = list.length >= 10 ? String(parseInt(page, 10) + 1) : "";
    return Response.success(list, next);
}
