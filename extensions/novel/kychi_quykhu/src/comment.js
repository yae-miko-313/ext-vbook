load('config.js');
// chịu, đại lão nào update hộ cái comment với
function execute(input, page) {
    var data = {};
    try {
        data = JSON.parse(input);
    } catch (e) {
        return Response.error('Dữ liệu không hợp lệ');
    }

    var bookId = data.bookId;
    var cursor = data.cursor;
    var csrfToken = data.csrfToken || "";

    // vBook passes the string returned as the 2nd arg of previous call into 'page'
    if (page) {
        try {
            var pageData = JSON.parse(page);
            if (pageData.cursor) cursor = pageData.cursor;
            if (pageData.bookId) bookId = pageData.bookId;
            if (pageData.csrfToken) csrfToken = pageData.csrfToken;
        } catch (e) {
            // If page is just a string (old style)
            cursor = page;
        }
    }

    if (!bookId || !cursor) return Response.success([], "");

    var apiUrl = BASE_URL + "/post/" + bookId + "/comments";

    var res = fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": csrfToken
        },
        body: JSON.stringify({ cursor: cursor })
    });

    if (res.ok) {
        var text = res.text();
        var json = JSON.parse(text);
        if (json && json.html) {
            var comments = [];
            var doc = Html.parse(json.html);
            var commentEls = doc.select('div[role="article"]');

            for (var i = 0; i < commentEls.size(); i++) {
                var el = commentEls.get(i);
                var nameEl = el.select('strong').first();
                var contentEl = el.select('p.font-content').first();
                if (!nameEl || !contentEl) continue;

                var cName = nameEl.text().trim();
                var cContent = contentEl.text().trim();
                var timeEl = el.select('span.text-gray-500').first();
                var cTime = timeEl ? timeEl.text().trim() : "";
                var imgEl = el.select('img').first();
                var cAvatar = imgEl ? imgEl.attr('src') : "";

                var isReply = el.attr('id').replace('comment-', '') !== el.attr('data-parent');

                comments.push({
                    name: (isReply ? "↳ " : "") + cName,
                    content: cContent,
                    avatar: normalizeUrl(cAvatar),
                    description: cTime
                });
            }

            var next = json.nextCursor ? JSON.stringify({
                bookId: bookId,
                cursor: json.nextCursor,
                csrfToken: csrfToken
            }) : "";

            return Response.success(comments, next);
        }
    }

    return Response.error("Không tải thêm được bình luận");
}