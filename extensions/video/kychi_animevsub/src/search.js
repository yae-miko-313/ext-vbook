load('config.js');

function execute(key, page) {
    if (!page) page = '1';
    var url = BASE_URL + '/?s=' + encodeURIComponent(key);
    if (page > 1) {
        url = BASE_URL + '/page/' + page + '/?s=' + encodeURIComponent(key);
    }

    var response = fetchPage(url);
    if (!response.ok) return Response.success([]);

    var doc = response.html();
    var list = [];
    var items = doc.select('.movie-item');

    items.forEach(function(item) {
        var titleEl = item.select('.movie-title a').first();
        if (!titleEl) return;

        var name = cleanText(titleEl.text());
        var link = normalizeUrl(titleEl.attr('href'));
        
        var imgEl = item.select('.movie-poster img').first();
        var cover = imgEl ? (imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '') : '';
        cover = normalizeUrl(cover);

        var ep = cleanText(item.select('.movie-episode-last').text());

        if (name && link) {
            list.push({
                name: name,
                link: link,
                cover: cover,
                description: ep,
                host: BASE_URL
            });
        }
    });

    return Response.success(list, (parseInt(page) + 1).toString());
}

