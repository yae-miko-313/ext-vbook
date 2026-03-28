load('config.js');

function normalizeDetailUrl(u) {
    u = u.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (u.charAt(u.length - 1) !== '/') u = u + '/';
    u = u.replace(/\/trang-\d+\/?(?:#.*)?$/, '/');
    return u;
}

function normalizeChapterHref(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function maxChapterListPage(doc) {
    var maxP = 1;
    doc.select('#list-chapter ul.pagination a').forEach(function(a) {
        var link = a.attr('href') || '';
        var m = link.match(/trang-(\d+)/i);
        if (m) {
            var num = parseInt(m[1], 10);
            if (num > maxP) maxP = num;
        }
    });
    return maxP;
}

function collectChaptersFromDoc(doc, list, seen) {
    doc.select('#list-chapter ul.list-chapter li a').forEach(function(a) {
        var chapterLink = normalizeChapterHref(a.attr('href') || '');
        var chapterTitle = a.text().trim();
        if (chapterLink && chapterTitle.length > 0 && !seen[chapterLink]) {
            seen[chapterLink] = true;
            list.push({
                name: chapterTitle,
                url: chapterLink,
                host: BASE_URL
            });
        }
    });
    if (list.length === 0) {
        doc.select('.list-chapter li a').forEach(function(a) {
            var chapterLink = normalizeChapterHref(a.attr('href') || '');
            var chapterTitle = a.text().trim();
            if (chapterLink && chapterTitle.length > 0 && !seen[chapterLink]) {
                seen[chapterLink] = true;
                list.push({
                    name: chapterTitle,
                    url: chapterLink,
                    host: BASE_URL
                });
            }
        });
    }
}

function execute(url) {
    var base = normalizeDetailUrl(url);

    var response = fetch(base);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();

    var maxPages = maxChapterListPage(doc);
    if (maxPages > 200) maxPages = 200;

    var chapters = [];
    var seen = {};

    collectChaptersFromDoc(doc, chapters, seen);

    for (var p = 2; p <= maxPages; p++) {
        var pageUrl = base + 'trang-' + p + '/';
        var res = fetch(pageUrl);
        if (!res.ok) break;
        collectChaptersFromDoc(res.html(), chapters, seen);
    }

    if (chapters.length === 0) {
        return Response.error('Không tìm thấy chương.');
    }

    return Response.success(chapters);
}
