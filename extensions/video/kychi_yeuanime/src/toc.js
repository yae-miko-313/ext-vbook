load('config.js');

function execute(url) {
    var response = fetchPage(url);
    if (!response.ok) return Response.success([]);

    var list = [];
    var addedSlugs = {};
    
    function getCleanUrl(u) {
        if (!u) return '';
        return u.split('?')[0].split('#')[0];
    }

    // 1. Try Parse from Hydration Data (Primary)
    var nextData = extractNextData(response.text());
    var episodes = extractJson(nextData, 'episodes');
    var movieSlug = url.split('/').pop().split('?')[0];

    if (episodes && Array.isArray(episodes)) {
        episodes.forEach(function (ep) {
            if (!ep.slug || addedSlugs[ep.slug]) return;
            addedSlugs[ep.slug] = true;

            var epName = ep.episode_label || ep.name;
            var epUrl = BASE_URL + '/xem-phim/' + movieSlug + '/' + ep.slug + '/' + (ep.language || 'vietsub');
            list.push({
                name: epName,
                url: epUrl,
                host: BASE_URL
            });
        });
    }

    // 2. Fallback: Parse from DOM only if JSON failed
    if (list.length === 0) {
        var doc = response.html();
        var items = doc.select('.grid a[href*="/xem-phim/"]');
        items.forEach(function (a) {
            var name = cleanText(a.select('span').first().text()) || cleanText(a.attr('title')) || cleanText(a.text());
            if (name && name.toLowerCase() !== 'xem ngay') {
                name = name.split(' - ')[0]; 
                var epUrl = normalizeUrl(a.attr('href'));
                var parts = epUrl.split('?')[0].split('/');
                var epSlug = parts.length > 2 ? parts[parts.length - 2] : '';
                
                if (epSlug && !addedSlugs[epSlug]) {
                    addedSlugs[epSlug] = true;
                    list.push({
                        name: name,
                        url: epUrl,
                        host: BASE_URL
                    });
                }
            }
        });
    }

    return Response.success(list);
}
