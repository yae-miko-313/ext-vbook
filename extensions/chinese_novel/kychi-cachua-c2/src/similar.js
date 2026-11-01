load("config.js");

// input = "<tên tác giả>|<book_id đang xem>" — proxy không có endpoint theo author_id,
// nên lấy sách cùng tác giả bằng cách search tên tác giả rồi lọc đúng tên.
function execute(input) {
    var parts = String(input || "").split("|");
    var author = parts[0] || "";
    var curId = parts[1] || "";
    if (!author) return Response.success([]);

    var response = fetchPage(BASE_URL + "/search?key=" + encodeURIComponent(author), { timeout: 15000, cache: 3600 });
    if (!response || !response.ok) {
        return Response.error("Lỗi tải danh sách cùng tác giả (HTTP " + (response ? response.status : "unknown") + ")");
    }

    var json = SafeJson(response);
    if (!json) return Response.success([]);

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
                if (bid === curId || seen[bid]) continue;

                var bAuthor = decodeText((b.author || "").replace(/<\/?em>/g, ""));
                if (bAuthor !== author) continue;
                seen[bid] = true;

                var cat = decodeText(b.category || "");
                var score = b.score ? "⭐" + b.score : "";
                list.push({
                    name: decodeText((b.book_name || "").replace(/<\/?em>/g, "")),
                    author: bAuthor,
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
