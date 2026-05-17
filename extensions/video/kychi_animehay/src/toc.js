load('config.js');

// toc.js — Extract episode list từ RSC payload
// RSC chứa "episodes":[...] với slug + server info đầy đủ

function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.success([]);

    var html = response.text();
    if (!html) return Response.success([]);

    var list = [];
    var seen = {};

    // Lấy slug phim từ URL detail: /phim/{slug}
    var slugMatch = url.match(/\/phim\/([^\/\?]+)/);
    var movieSlug = slugMatch ? slugMatch[1] : '';

    // RSC payload chứa episodes: mỗi entry có "name":"Tập 01","slug":"tap-01"
    // Chỉ lấy entries có type "m3u8" (tránh duplicate với "embed")
    var pattern = /"name"\s*:\s*"([^"]+)"\s*,\s*"slug"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"m3u8"/g;
    var match;
    var firstServer = '';

    while ((match = pattern.exec(html)) !== null) {
        var epName = match[1];
        var epSlug = match[2];

        // Tránh trùng tập (có nhiều server)
        if (seen[epSlug]) continue;
        seen[epSlug] = true;

        var epUrl = BASE_URL + '/phim/' + movieSlug + '/' + epSlug;

        list.push({
            name: epName,
            url: epUrl,
            host: BASE_URL
        });
    }

    // Fallback nếu regex không match: thử escaped pattern
    if (list.length === 0) {
        var escPattern = /\\?"name\\?"\s*:\s*\\?"([^"\\]+)\\?"\s*,\s*\\?"slug\\?"\s*:\s*\\?"([^"\\]+)\\?"\s*,\s*\\?"type\\?"\s*:\s*\\?"m3u8\\?"/g;
        while ((match = escPattern.exec(html)) !== null) {
            var eName = match[1];
            var eSlug = match[2];

            if (seen[eSlug]) continue;
            seen[eSlug] = true;

            list.push({
                name: eName,
                url: BASE_URL + '/phim/' + movieSlug + '/' + eSlug,
                host: BASE_URL
            });
        }
    }

    // Final fallback: nếu vẫn rỗng, thử DOM parse
    if (list.length === 0) {
        var doc = response.html();
        if (doc) {
            var epLinks = doc.select('a[href*="/tap-"]');
            epLinks.forEach(function (a) {
                var href = normalizeUrl(a.attr('href'));
                var name = cleanText(a.text());
                var tapMatch = href.match(/tap-[^\/\?]+/);
                var key = tapMatch ? tapMatch[0] : href;

                if (!seen[key] && href.indexOf(movieSlug) >= 0) {
                    seen[key] = true;
                    list.push({
                        name: name || key,
                        url: href,
                        host: BASE_URL
                    });
                }
            });
        }
    }

    return Response.success(list);
}
