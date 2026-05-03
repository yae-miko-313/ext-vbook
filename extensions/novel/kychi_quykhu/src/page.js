load('config.js');

/**
 * Main: Get list of chapter pagination URLs
 */
function execute(url) {
    url = String(url || '').trim();
    if (!url) return Response.error('URL truyện không hợp lệ.');

    var doc = loadDocument(url, 15000, 'nav[aria-label="Phân trang danh sách chương"], #chapter-list-title');
    if (!doc) return Response.error('Không tải được nội dung trang: ' + url);

    var data = [];
    var anchors = doc.select('nav[aria-label="Phân trang danh sách chương"] a[href*="pagechap="]');
    var anchorCount = getSize(anchors);
    
    if (anchorCount === 0) {
        return Response.success([url]);
    }

    var lastNumber = 1;
    for (var j = 0; j < anchorCount; j++) {
        var anchor = getElement(anchors, j);
        if (!anchor) continue;
        
        var href = anchor.attr('href');
        var match = href.match(/pagechap=(\d+)/);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num > lastNumber) lastNumber = num;
        }
    }

    for (var i = 1; i <= lastNumber; i++) {
        data.push(url + '?pagechap=' + i);
    }

    return Response.success(data);
}

