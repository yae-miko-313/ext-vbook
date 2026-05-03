load('config.js');

/**
 * Main: Get genre list from homepage
 */
function execute() {
    var response = fetchPage(BASE_URL);
    if (!response.ok) return Response.error('HTTP Error: Không thể tải trang chủ');

    var doc = response.html();
    var data = [];
    
    // Parse genre links from homepage
    var genreEls = doc.select('a[href*="/the-loai/"]');
    var genreCount = getSize(genreEls);
    var seen = {};

    for (var i = 0; i < genreCount; i++) {
        var e = getElement(genreEls, i);
        if (!e) continue;
        
        var text = cleanText(e.text());
        var href = e.attr('href');
        if (text && href) {
            var url = normalizeUrl(href);
            if (!seen[url]) {
                seen[url] = true;
                data.push({
                    title: text,
                    input: url,
                    script: 'gen.js'
                });
            }
        }
    }

    if (data.length === 0) {
        return Response.error('Không tìm được danh sách thể loại.');
    }

    return Response.success(data);
}

