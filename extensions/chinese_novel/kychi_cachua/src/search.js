load('config.js');

function execute(key, page) {
    if (!page) page = 1;
    var url = BASE_URL + "/search?title=" + encodeURIComponent(key) + "&tab=小说&source=番茄&page=" + page;
    
    var response = fetchWithUA(url);
    if (response.ok) {
        var json = SafeJson(response);
        var list = [];
        var bookList = findBookList(json);

        if (bookList && Array.isArray(bookList)) {
            bookList.forEach(function(item) {
                var bookId = item.book_id || item.bookId || item.id;
                var name = item.book_name || item.title;
                if (name && bookId) {
                    list.push({
                        name: decodeText(name),
                        cover: replaceCover(item.book_cover || item.thumb_url),
                        author: decodeText(item.book_author || item.author),
                        description: decodeText(item.book_abstract || item.abstract),
                        detail: (item.book_sort || item.category || "") + " | " + (item.score || "") + "分",
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
    var keys = ["data", "book_list", "list", "ret_data", "result"];
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
