load('config.js');
function execute(url) {
    var data = [];
    var doc = loadDocument(url, 15000, 'nav[aria-label="Phân trang danh sách chương"], #chapter-list-title');
    if (!doc) return Response.error('HTTP Error: Unable to load page');
    var anchors = doc.select('nav[aria-label="Phân trang danh sách chương"] a[href*="pagechap="]');
    if (anchors.length === 0) {
        return Response.success([url]);
    }
    var lastNumber = -1;
    anchors.forEach(function(anchor) {
        var href = anchor.attr('href');
        var match = href.match(/pagechap=(\d+)/);
        if (match) {
            var pageNumber = parseInt(match[1], 10);
            lastNumber = Math.max(lastNumber, pageNumber);
        }
    });
    for (var i = 1; i <= lastNumber; i++) {
        data.push(url + '?pagechap=' + i);
    }
    return Response.success(data);
}
