load('config.js');
function execute(key, page) {
    if (!page) page = '1';
    var response = fetchPage(BASE_URL + '/search?keyword=' + key, {
        method: 'GET',
        queries: {
            page: page
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var comiclist = [];
    var next = null;
    var nextAnchor = doc.select('.my-5 nav a').last();
    if (nextAnchor) {
        var nextHref = nextAnchor.attr('href') || '';
        var nextMatch = nextHref.match(/\d+$/);
        if (nextMatch != null) {
            next = nextMatch[0];
        }
    }

    var cards = doc.select('#postTabsContent a.relative.shrink-0');
    if (cards.size() === 0) {
        cards = doc.select('.container .mb-3 .mx-auto .flex');
    }

    cards.forEach(function(e) {
        var a = e.select('a').first();
        if (!a) a = e;
        var img = e.select('img').first();
        var name = a.attr('title') || (a ? a.text().trim() : '');
        if (!name && img) name = img.attr('alt') || '';
        var link = a.attr('href');
        var cover = img ? (img.attr('src') || img.attr('data-src') || '') : '';
        if (cover.indexOf('//') === 0) cover = 'https:' + cover;
        if (!name || !link) return;
        comiclist.push({
            name: name,
            link: link,
            cover: cover,
            description: '',
            host: BASE_URL
        });
    });
    return Response.success(comiclist, next);
}
