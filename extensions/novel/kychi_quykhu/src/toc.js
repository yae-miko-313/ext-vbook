load('config.js');

function execute(url) {
    var data = [];
    var doc = loadDocument(url, 15000);
    if (!doc) return Response.error('HTTP Error: Unable to load page');
    var chapList = doc.select("a[href*='/chuong-']");
    var chapListCount = chapList.length;
    var seen = {};

    for (var j = 0; j < chapListCount; j++) {
        var element = chapList.get(j);
        var href = normalizeLink(element.attr('href') || '');
        if (!href || seen[href]) continue;
        seen[href] = true;
        data.push({
            name: element.text() || href.split('/').pop().replace(/-/g, ' '),
            url: href,
            host: BASE_URL
        });
    }

    return Response.success(data);
}
