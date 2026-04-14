load('config.js');

function normalizeLink(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function execute(key, page) {
    if (!page) page = '1';
    var response = fetch(BASE_URL, {
        method: "GET",
        queries: {
            q: key,
            page: page
        }
    });
    if (response.ok) {
        var doc = response.html();
        var data = [];
        doc.select('.list-new .row').forEach(function(e) {
            var titleEl = e.select('.col-title h3, h3').first();
            var a = e.select('a').first();
            var img = e.select('.thumb img, img').first();
            var desc = e.select('.chapter-text').first();

            var name = titleEl ? titleEl.text().trim() : '';
            var link = normalizeLink(a ? a.attr('href') : '');
            var cover = img ? (img.attr('src') || img.attr('data-src') || '') : '';
            if (cover.indexOf('-thumbw') >= 0) cover = cover.replace('-thumbw', '');
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

        return Response.success(data);
    }
    return Response.error('HTTP Error: ' + response.status);
}