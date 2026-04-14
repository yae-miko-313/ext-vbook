load('config.js');

function normalizeLink(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function findNextPage(doc) {
    var next = null;
    var lis = doc.select('ul.pagination > li');
    var idx = -1;
    for (var i = 0; i < lis.size(); i++) {
        var cls = lis.get(i).attr('class') || '';
        if (cls.indexOf('active') >= 0) {
            idx = i;
            break;
        }
    }
    if (idx >= 0) {
        for (var j = idx + 1; j < lis.size(); j++) {
            var a = lis.get(j).select('a').first();
            if (!a) continue;
            var href = a.attr('href') || '';
            var m = href.match(/[?&]page=(\d+)/i) || href.match(/trang-(\d+)/i);
            if (m) {
                next = m[1];
                break;
            }
        }
    }
    return next;
}

function execute(url, page) {
    if (!page) page = '1';
    var response = fetch(url, {
        method: "GET",
        queries: {
            page: page
        }
    });
    if (response.ok) {
        var doc = response.html();
        var next = findNextPage(doc);
        var data = [];
        doc.select('.index-intro .item').forEach(function(e) {
            var titleEl = e.select('.title h3, h3').first();
            var a = e.select('a').first();
            var img = e.select('img').first();
            var desc = e.select('.text-center, .chapter-text').first();

            var name = titleEl ? titleEl.text().trim() : '';
            var link = normalizeLink(a ? a.attr('href') : '');
            var cover = img ? (img.attr('src') || img.attr('data-src') || '') : '';
            if (cover.indexOf('//') === 0) cover = 'https:' + cover;

            if (!name || !link) return;
            data.push({
                name: name,
                link: link,
                cover: cover,
                description: desc ? desc.text().trim() : '',
                host: BASE_URL
            });
        });

        return Response.success(data, next);
    }
    return Response.error('HTTP Error: ' + response.status);
}