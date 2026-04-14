load('config.js');

function execute(url) {
    var response = fetch(url, {
        headers: {
            'User-Agent': BASE_UA
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var list = [];
    var seen = {};

    doc.select('table.w-full.mb-5 tr td a, .w-full.mb-5 a').forEach(function(a) {
        var name = a.text().trim();
        var chapterUrl = normalizeLink(a.attr('href') || '');
        if (!name || !chapterUrl || seen[chapterUrl]) return;
        seen[chapterUrl] = true;
        list.push({
            name: name,
            url: chapterUrl,
            host: BASE_URL
        });
    });

    return Response.success(list);
}
