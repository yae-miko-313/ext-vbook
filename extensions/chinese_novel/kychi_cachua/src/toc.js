load('config.js');

function execute(url) {
    var bookIdMatch = url.match(/(?:bookId=|page\/|detail\/)([a-zA-Z0-9_-]+)/);
    var bookId = bookIdMatch ? bookIdMatch[1] : null;
    
    if (!bookId) {
        return Response.error("Không tìm thấy Book ID trong URL: " + url);
    }

    var apiUrl = BASE_URL + "/catalog?book_id=" + bookId + "&source=番茄&tab=小说";
    var response = fetchWithUA(apiUrl);
    
    if (response.ok) {
        var json = SafeJson(response);
        var chapters = [];
        var chapterList = json.data;

        if (chapterList && Array.isArray(chapterList)) {
            chapterList.forEach(function(item) {
                chapters.push({
                    name: decodeText(item.title),
                    url: BASE_URL + "/content?item_id=" + item.item_id + "&book_id=" + bookId + "&source=番茄&tab=小说",
                    host: BASE_URL
                });
            });
        }

        return Response.success(chapters);
    }

    return Response.error("Không thể tải mục lục (HTTP " + response.status + ")");
}
