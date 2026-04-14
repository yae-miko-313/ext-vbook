load('config.js');

function execute(url) {
    var data = [];
    var doc = loadDocument(url, 15000, '#chapter-list-content, #chapter-list-title');
    if (!doc) return Response.error('HTTP Error: Unable to load page');
    var chapList = doc.select('#chapter-list-content a[href*="/chuong-"], [aria-labelledby="chapter-list-title"] a[href*="/chuong-"]');
    var chapListCount = chapList.length;
    var seen = {};

    for (var j = 0; j < chapListCount; j++) {
        var element = chapList.get(j);
        var href = normalizeLink(element.attr('href') || '');
        if (!href || seen[href]) continue;
        seen[href] = true;
        var chapterName = element.attr('title') || element.text() || href.split('/').pop().replace(/-/g, ' ');
        data.push({
            name: String(chapterName).trim(),
            url: href,
            host: BASE_URL
        });
    }

    return Response.success(data);
}
