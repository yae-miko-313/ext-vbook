load('config.js');

function execute(key, page) {
    if (!page) page = 1;
    var url = BASE_URL + "/api/search?keywords=" + encodeURIComponent(key) + "&page=" + page;
    
    var response = fetchWithUA(url);
    if (response.ok) {
        var json = response.json();
        var list = [];
        
        // Use the same robust finder as gen.js
        var bookList = findBookList(json);

        if (bookList && Array.isArray(bookList)) {
            bookList.forEach(function(item) {
                var name = item.book_name || item.title || item.bookName;
                if (name) {
                    list.push({
                        name: name,
                        cover: replaceCover(item.book_cover || item.thumb_url || item.thumbUri),
                        author: item.book_author || item.author,
                        description: item.book_abstract || item.abstract,
                        detail: (item.book_sort || item.category || "") + " | " + (item.book_word_count || item.word_number || "") + " 字",
                        link: BASE_URL + "/api/detail?bookId=" + (item.book_id || item.bookId),
                        host: BASE_URL
                    });
                }
            });
        }

        var next = (list.length >= 10) ? (parseInt(page, 10) + 1).toString() : null;
        return Response.success(list, next);
    }

    return Response.error("Lỗi tìm kiếm (HTTP " + response.status + ")");
}

function findBookList(obj) {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj;
    var keys = ["request_result", "data", "book_list", "list", "ret_data"];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj[k]) {
            if (Array.isArray(obj[k])) return obj[k];
            var sub = findBookList(obj[k]);
            if (sub && Array.isArray(sub) && sub.length > 0) return sub;
        }
    }
    return null;
}
