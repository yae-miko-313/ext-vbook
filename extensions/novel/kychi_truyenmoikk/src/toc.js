load('config.js');
function execute(url) {
    url = url.replace(/\/$/, '');
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();
    var chapters = [];
    var items = doc.select('.list-chapter li a');
    for (var i = 0; i < items.size(); i++) {
        var e = items.get(i);
        chapters.push({
            name: e.text().trim(),
            url: e.attr('href'),
            host: BASE_URL
        });
    }

    var maxPage = 1;
    var pages = doc.select('.pagination li a');
    for (var j = 0; j < pages.size(); j++) {
        var pageUrl = pages.get(j).attr('href') || '';
        var match = pageUrl.match(/trang-(\d+)/);
        if (match) {
            var pageNum = parseInt(match[1], 10);
            if (pageNum > maxPage) maxPage = pageNum;
        }
    }

    if (maxPage > 1) {
        for (var k = 2; k <= maxPage; k++) {
            var pageResponse = fetchPage(url + '/trang-' + k + '/');
            if (!pageResponse.ok) continue;
            var pageDoc = pageResponse.html();
            var pageItems = pageDoc.select('.list-chapter li a');
            for (var x = 0; x < pageItems.size(); x++) {
                var p = pageItems.get(x);
                chapters.push({
                    name: p.text().trim(),
                    url: p.attr('href'),
                    host: BASE_URL
                });
            }
        }
    }

    return Response.success(chapters);
}