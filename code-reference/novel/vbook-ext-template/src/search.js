load('config.js');

function execute(key, page) {
    var keyword = encodeURIComponent(key || '');
    var target = BASE_URL + '/search?keyword=' + keyword;

    if (page) {
        target += '&page=' + page;
    }

    var response = fetch(target);
    if (!response.ok) {
        return Response.error('Search failed: ' + response.status);
    }

    var doc = response.html();

    var items = [];
    // TODO: update selectors for your target site.
    doc.select('.book-item').forEach(function (el) {
        items.push({
            name: el.select('.book-title').text(),
            link: el.select('a').attr('href'),
            cover: el.select('img').attr('src'),
            description: el.select('.book-meta').text(),
            host: BASE_URL
        });
    });

    var next = null;
    var nextHref = doc.select('a[rel=next]').attr('href');
    if (nextHref) {
        var match = nextHref.match(/page=(\d+)/);
        if (match) {
            next = match[1];
        }
    }

    return Response.success(items, next);
}
