load('config.js');

function normalizeLink(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function execute(url) {
    var response = fetch(url);
    if (response.ok){
        var doc = response.html();
        var list = [];
        var seen = {};

        doc.select('.list-chapter a, .l-chapters a, #list-chapter a').forEach(function(a) {
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

        if (list.length === 0) {
            var firstChapter = doc.select('.l-chapters .chapter-text, .chapter-text').first();
            var totalMatch = firstChapter ? firstChapter.text().match(/(\d+)/) : null;
            var total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
            for (var i = 1; i <= total; i++) {
                list.push({
                    name: 'Chương ' + i,
                    url: normalizeLink(url + '/chuong-' + i),
                    host: BASE_URL
                });
            }
        }

        if (list.length === 0) {
            return Response.error('Không tìm thấy danh sách chương.');
        }

        return Response.success(list);
    }
    return Response.error('HTTP Error: ' + response.status);
}