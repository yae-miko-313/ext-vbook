load("config.js");

function execute(key, page) {
    if (page && parseInt(page, 10) > 1) return Response.success([]);

    var response = fetchPage(BASE_URL + "/search?key=" + encodeURIComponent(key), { timeout: 15000 });

    if (!response || !response.ok) {
        return Response.error("Lỗi tìm kiếm (HTTP " + (response ? response.status : "unknown") + ")");
    }

    var json = SafeJson(response);
    if (!json) return Response.error("Lỗi phân tích kết quả tìm kiếm");

    var list = [];
    var seen = {};
    var tabs = json.search_tabs || [];

    for (var t = 0; t < tabs.length; t++) {
        var items = tabs[t].data || tabs[t].book_data || [];
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var bd = (item.book_data && item.book_data.length > 0) ? item.book_data : [item];
            for (var c = 0; c < bd.length; c++) {
                var b = bd[c];
                if (!b || !b.book_id || !b.book_name) continue;
                var bid = String(b.book_id);
                if (seen[bid]) continue;
                seen[bid] = true;

                var cat = decodeText(b.category || "");
                var score = b.score ? "\u2B50" + b.score : "";
                list.push({
                    name: decodeText((b.book_name || "").replace(/<\/?em>/g, "")),
                    author: decodeText((b.author || "").replace(/<\/?em>/g, "")),
                    cover: b.thumb_url || "",
                    description: decodeText(cleanText(b.abstract || "")),
                    detail: [cat, score].filter(Boolean).join(" "),
                    link: bookLink(bid),
                    host: BASE_URL
                });
            }
        }
    }

    return Response.success(list);
}
