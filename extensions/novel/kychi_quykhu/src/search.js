load('config.js');

function normalizeLink(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function slugToTitle(slug) {
    var s = String(slug || '').trim();
    if (!s) return '';
    return s.split('-').map(function(part) {
        if (!part) return '';
        return part.charAt(0).toUpperCase() + part.substring(1);
    }).join(' ').trim();
}

function extractCardGenre(card) {
    if (!card) return '';
    var genreEl = card.select('a[href*="/the-loai/"]').first();
    if (genreEl) {
        var text = genreEl.text().trim();
        if (text) return text;
        var href = genreEl.attr('href') || '';
        var m = href.match(/\/the-loai\/([^\/?#]+)/i);
        if (m) return slugToTitle(m[1]);
    }
    return '';
}

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

    var cards = doc.select('#postTabsContent .group.flex.items-start');
    if (cards.size() === 0) {
        cards = doc.select('#postTabsContent a.relative.shrink-0, .container .mb-3 .mx-auto .flex');
    }

    cards.forEach(function(e) {
        var a = e.select('a').first();
        if (!a) a = e;
        var img = e.select('img').first();
        var genreText = extractCardGenre(e);
        var authorText = '';
        var authorEl = e.select('a[href*="/thanh-vien/"]').first();
        if (authorEl) authorText = authorEl.text().trim();
        var name = a.attr('title') || (a ? a.text().trim() : '');
        if (!name && img) name = img.attr('alt') || '';
        var link = normalizeLink(a ? a.attr('href') : '');
        var cover = img ? (img.attr('src') || img.attr('data-src') || '') : '';
        if (cover.indexOf('//') === 0) cover = 'https:' + cover;
        if (!name || !link) return;
        comiclist.push({
            name: name,
            link: link,
            cover: cover,
            description: genreText || authorText || '',
            host: BASE_URL
        });
    });
    return Response.success(comiclist, next);
}
