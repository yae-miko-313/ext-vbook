load('config.js');

function execute(url) {
    var bookId = extractBookId(url);
    if (!bookId) return Response.error('Không tìm thấy Book ID');

    var apiUrl = BASE_URL + '/catalog?book_id=' + bookId + '&source=番茄&tab=小说';
    var response = fetchWithUA(apiUrl);
    
    if (response.ok) {
        var json = SafeJson(response);
        var chapters = [];
        var chapterList = (json && json.data) ? json.data : json;

        if (chapterList && Array.isArray(chapterList)) {
            chapterList.forEach(function(item) {
                var itemId = item.item_id || item.id;
                chapters.push({
                    name: decodeText(item.title || item.name || ""),
                    url: BASE_URL + "/content?item_id=" + itemId + "&book_id=" + bookId + "&source=番茄&tab=小说",
                    host: BASE_URL
                });
            });
        }

        if (chapters.length === 0) {
            return Response.error("Mục lục trống hoặc sai cấu trúc dữ liệu.");
        }

        return Response.success(chapters);
    }

    return Response.error("Không thể tải mục lục (HTTP " + response.status + ")");
}
