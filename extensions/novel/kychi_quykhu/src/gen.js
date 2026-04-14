load('config.js');

function findNextPage(doc) {
    var last = doc.select('.my-5 nav a').last();
    if (!last) return null;
    var href = last.attr('href') || '';
    var m = href.match(/\d+$/);
    return m ? m[0] : null;
}

function execute(url, page) {
    if (!page) page = '1';

    var response = fetch(url, {
        headers: {
            'User-Agent': BASE_UA
        },
        queries: {
            page: page
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var list = [];

    doc.select('.container .mb-3 .mx-auto .transform').forEach(function(e) {
        var a = e.select('a').first();
        var img = e.select('img').first();
        var desc = e.select('p a, p').first();

        var name = a ? a.text().trim() : '';
        var link = normalizeLink(a ? a.attr('href') : '');
        var cover = img ? (img.attr('src') || img.attr('data-src') || '') : '';
        if (cover.indexOf('//') === 0) cover = 'https:' + cover;

        if (!name || !link) return;
        list.push({
            name: name,
            link: link,
            cover: cover,
            description: desc ? desc.text().trim() : '',
            host: BASE_URL
        });
    });

    return Response.success(list, findNextPage(doc));
}
