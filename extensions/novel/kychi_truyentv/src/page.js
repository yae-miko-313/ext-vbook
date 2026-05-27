load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) {
        return Response.error('Không tải được thông tin phân trang');
    }
    
    var doc = response.html();
    var data = [];
    
    // Extensively match pagination anchors in both desktop and mobile structures
    var anchors = doc.select('#list-chapter .pagination a, #list-chapter .custom-pagination-list a, #mobile-list-chapter .pagination a, .custom-pagination-list a, .pagination a');
    
    var lastPage = 1;
    for (var i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        if (a) {
            var href = a.attr('href');
            if (href) {
                var match = href.match(/page=(\d+)/);
                if (match) {
                    var pNum = parseInt(match[1], 10);
                    if (pNum > lastPage) lastPage = pNum;
                }
            }
        }
    }
    
    // Populate chapter list page URLs
    for (var p = 1; p <= lastPage; p++) {
        if (p === 1) {
            data.push(url);
        } else {
            if (url.indexOf('?') >= 0) {
                data.push(url + '&page=' + p);
            } else {
                data.push(url + '?page=' + p);
            }
        }
    }
    
    return Response.success(data);
}
