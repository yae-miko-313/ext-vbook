load('config.js');

function execute(url, page) {
    var target = BASE_URL + url;

    if (page && !/([?&])page=\d+/.test(target)) {
        target += (target.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
    }

    var response = fetch(target);
    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();

    // TODO: update selectors for your target site.
    var items = [];
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
