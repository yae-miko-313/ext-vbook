load('config.js');

function execute(url, page) {
    if (!page) page = 0;
    var finalUrl = url.replace("{{page}}", page);

    var response = fetchWithUA(finalUrl);
    if (response.ok) {
        var json = SafeJson(response);
        var list = [];
        var bookList = findBookList(json);

        if (bookList && Array.isArray(bookList)) {
            bookList.forEach(function(item) {
                var bookId = item.book_id || item.bookId || item.id;
                var name = item.book_name || item.bookName || item.title;
                if (name && bookId) {
                    list.push({
                        name: decodeText(name),
                        cover: replaceCover(item.thumb_url || item.book_cover),
                        author: decodeText(item.author || item.book_author),
                        description: decodeText(item.author || item.book_author),
                        detail: (item.category || item.book_sort || "") + " | " + (item.score || "") + "分",
                        link: getOriginalLink(bookId), // ★ Numeric link
                        host: BASE_URL
                    });
                }
            });
        }

        var next = (list.length >= 10) ? (parseInt(page, 10) + 1).toString() : null;
        return Response.success(list, next);
    }
    return Response.error("Lỗi HTTP " + response.status);
}

function findBookList(obj) {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj;
    var keys = ["data", "book_list", "list", "ret_data"];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj[k]) {
            if (Array.isArray(obj[k])) return obj[k];
            var sub = findBookList(obj[k]);
            if (sub) return sub;
        }
    }
    return null;
}
