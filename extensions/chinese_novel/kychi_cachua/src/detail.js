load('config.js');

function execute(url) {
    var bookId = extractBookId(url);
    if (!bookId) return Response.error('Không tìm thấy Book ID');

    var apiUrl = BASE_URL + '/detail?book_id=' + bookId + '&source=番茄&tab=小说';
    var res = fetchWithUA(apiUrl);
    
    if (!res || !res.ok) {
        return Response.error('Lỗi tải dữ liệu (HTTP ' + (res ? res.status : 'unknown') + ')');
    }

    var json = SafeJson(res);
    if (!json) return Response.error('Lỗi parse JSON');

    var data = json.data;
    if (Array.isArray(data)) data = data[0];
    if (!data) return Response.error("Không tìm thấy truyện");

    var isOngoing = data.creation_status !== '0' && data.creation_status !== 0;
    var bId = data.book_id || data.id || bookId;
    
    var rawDesc = data.abstract || data.description || '';
    var desc = decodeText(rawDesc);
    if (desc) {
        desc = String(desc).replace(/\n/g, '<br>');
    }

    return Response.success({
        name: decodeText(data.book_name || data.title),
        cover: replaceCover(data.thumb_url || data.book_cover),
        author: decodeText(data.author || data.book_author),
        description: desc || '',
        detail: "状态: " + (isOngoing ? "连载中" : "已完结") + "<br>评分: " + (data.score || "0") + "<br>章节: " + (data.serial_count || "0"),
        ongoing: isOngoing,
        link: getOriginalLink(bId),
        host: BASE_URL
    });
}
