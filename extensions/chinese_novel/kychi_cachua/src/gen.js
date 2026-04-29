load('config.js');

function execute(url, page) {
    if (!page) page = 0; // Web API thường bắt đầu từ index 0
    var finalUrl = url.replace("{{page}}", page);

    try {
        var response = fetchWithUA(finalUrl);
        if (response.ok) {
            var json = SafeJson(response);
            var list = [];
            
            var bookList = findBookList(json);

            if (bookList && Array.isArray(bookList)) {
                bookList.forEach(function(item) {
                    var name = item.book_name || item.bookName || item.title;
                    var author = item.author || item.book_author || "Đang cập nhật";
                    if (name) {
                        list.push({
                            name: decodeText(name),
                            cover: replaceCover(item.thumb_url || item.thumbUri || item.book_cover),
                            author: decodeText(author),
                            description: decodeText(author), // Hiển thị tác giả ở sub-title
                            detail: (item.category || item.book_sort || "") + " | " + (item.score || "") + "分",
                            link: FANQIE_URL + "/page/" + (item.book_id || item.bookId || item.id),
                            host: BASE_URL
                        });
                    }
                });
            }

            if (list.length === 0) {
                return Response.error("Không tìm thấy dữ liệu. API: " + finalUrl);
            }

            var next = (list.length >= 10) ? (parseInt(page, 10) + 1).toString() : null;
            return Response.success(list, next);
        }
        return Response.error("Lỗi HTTP " + response.status + " tại: " + finalUrl);
    } catch (e) {
        return Response.error("Lỗi thực thi: " + e.message);
    }
}

function findBookList(obj) {
    if (!obj) return null;
    if (Array.isArray(obj)) return obj;
    
    // Check nested data.data or book_list
    if (obj.data) {
        if (Array.isArray(obj.data)) return obj.data;
        if (obj.data.data && Array.isArray(obj.data.data)) return obj.data.data;
        if (obj.data.book_list && Array.isArray(obj.data.book_list)) return obj.data.book_list;
    }
    
    var keys = ["book_list", "list", "data", "ret_data"];
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (obj[k] && Array.isArray(obj[k])) return obj[k];
    }
    return null;
}
