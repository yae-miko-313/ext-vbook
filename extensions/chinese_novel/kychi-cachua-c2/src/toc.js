load("config.js");

function execute(url) {
    var bookId = getBookId(url);
    if (!bookId) return Response.error("Không tìm thấy ID truyện");

    var response = fetchPage(BASE_URL + "/catalog?book_id=" + bookId, { timeout: 20000, cache: 600 });

    if (!response || !response.ok) {
        return Response.error("Lỗi tải mục lục (HTTP " + (response ? response.status : "unknown") + ")");
    }

    var json = SafeJson(response);
    if (!json || json.code !== 0 || !json.data) return Response.success([]);

    var rawList = json.data.item_data_list || json.data.catalog_data || [];
    var chapters = [];

    for (var i = 0; i < rawList.length; i++) {
        var item = rawList[i];
        if (!item) continue;
        var itemId = item.item_id || item.catalog_id || "";
        var title  = item.title  || item.catalog_title || "";
        if (itemId && title) {
            chapters.push({ name: decodeText(title), url: String(itemId), host: BASE_URL });
        }
    }

    return Response.success(chapters);
}
