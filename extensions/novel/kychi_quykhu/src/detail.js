load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var res = fetchPage(url);
    if (!res.ok) return Response.error('Không thể tải trang: ' + res.status);

    var doc = res.html();
    if (!doc) return Response.error('Không thể parse nội dung trang');

    var name = cleanText(doc.select('h1').text());
    if (!name) name = doc.select('meta[property="og:title"]').attr('content');

    var cover = doc.select('meta[property="og:image"]').attr('content');
    if (!cover) {
        var coverImg = doc.select('img[style*="aspect-ratio"]').first();
        if (coverImg) cover = coverImg.attr('src');
    }

    var author = 'Đang cập nhật';
    var statusText = 'Đang ra';
    var genres = [];
    var detailParts = [];
    var authorUrl = '';

    // Parse info rows
    var infoRows = doc.select('div.flex.items-center');
    var rowCount = getSize(infoRows);
    
    for (var i = 0; i < rowCount; i++) {
        var row = getElement(infoRows, i);
        if (!row) continue;
        
        var label = row.select('span.text-gray-500').text().trim();
        if (!label) continue;

        var valEl = row.select('strong, a, span:not(.text-gray-500)').first();
        if (!valEl) continue;
        var val = valEl.text().trim();

        if (label.indexOf('Tác giả') >= 0) {
            author = val;
            authorUrl = valEl.attr('href');
            detailParts.push('<b>Tác giả:</b> ' + val);
        } else if (label.indexOf('Trạng thái') >= 0) {
            statusText = normalizeStatus(val);
            detailParts.push('<b>Trạng thái:</b> ' + statusText);
        } else if (label.indexOf('Thể loại') >= 0) {
            var genreLinks = row.select('a');
            var gCount = getSize(genreLinks);
            var genreTexts = [];
            for (var j = 0; j < gCount; j++) {
                var g = getElement(genreLinks, j);
                var gTitle = g.text().trim();
                var gUrl = g.attr('href');
                if (gTitle && gUrl) {
                    genres.push({
                        title: gTitle,
                        input: normalizeUrl(gUrl),
                        script: 'gen.js'
                    });
                    genreTexts.push(gTitle);
                }
            }
            if (genreTexts.length > 0) detailParts.push('<b>Thể loại:</b> ' + genreTexts.join(', '));
        } else if (label.indexOf('Cập nhật') >= 0 || label.indexOf('Ngày đăng') >= 0) {
            detailParts.push('<b>' + label + '</b> ' + val);
        }
    }

    var description = doc.select('#ct-p').html() || doc.select('.chap').html() || "";
    var ongoing = statusText.indexOf('Hoàn thành') === -1;

    var suggests = [];
    if (authorUrl) {
        suggests.push({
            title: 'Truyện cùng tác giả',
            input: normalizeUrl(authorUrl),
            script: 'gen.js'
        });
    }

    return Response.success({
        name: name,
        cover: normalizeUrl(cover),
        host: BASE_URL,
        author: author,
        description: description,
        detail: detailParts.join('<br>'),
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        link: url
    });
}