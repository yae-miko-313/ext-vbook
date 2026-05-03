load('config.js');

function slugToTitle(slug) {
    var s = String(slug || '').trim();
    if (!s) return '';
    return s.split('-').map(function(part) {
        if (!part) return '';
        return part.charAt(0).toUpperCase() + part.substring(1);
    }).join(' ').trim();
}

function extractCardGenre(card, fallbackGenre) {
    if (!card) return fallbackGenre || '';
    var genreEl = card.select('a[href*="/the-loai/"]').first();
    if (genreEl) {
        var t = genreEl.text().trim();
        if (t) return t;
        var href = genreEl.attr('href') || '';
        var m = href.match(/\/the-loai\/([^\/?#]+)/i);
        if (m) return slugToTitle(m[1]);
    }
    return fallbackGenre || '';
}

function isArray(value) {
    return value && typeof value === 'object' && typeof value.length === 'number' && typeof value.splice === 'function';
}

function collectFromNode(node, out, seen) {
    if (!node || typeof node !== 'object') return;
    if (isArray(node)) {
        for (var i = 0; i < node.length; i++) collectFromNode(node[i], out, seen);
        return;
    }

    var title = node.name || node.title || node.bookName || node.novelName;
    var slug = node.slug || node.path || node.href || node.link || node.url;
    var cover = node.coverUrl || node.cover || node.thumbnail || node.image || '';
    var intro = node.introduction || node.description || '';

    if (title && slug && typeof title === 'string' && typeof slug === 'string' && slug.length > 2) {
        if (slug.indexOf('/truyen/') === -1 && slug.indexOf('/doc-truyen/') === -1 && slug.indexOf('http') !== 0) {
            slug = '/truyen/' + slug.replace(/^\/+/, '');
        }
        var link = normalizeUrl(slug);
        if (!seen[link]) {
            seen[link] = true;
            out.push({
                name: String(title).trim(),
                link: link,
                cover: normalizeUrl(cover),
                description: cleanText(intro),
                host: BASE_URL
            });
        }
    }

    for (var key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
            collectFromNode(node[key], out, seen);
        }
    }
}

function parseDomCards(doc, listGenre) {
    var comiclist = [];
    var cards = doc.select('#postTabsContent .group.flex.items-start');
    if (getSize(cards) === 0) {
        cards = doc.select('#postTabsContent a.relative.shrink-0, .container .mb-3 .mx-auto .flex, .container .mb-3 .mx-auto .transform, .list-truyen .row');
    }

    var cardCount = getSize(cards);
    for (var i = 0; i < cardCount; i++) {
        var e = getElement(cards, i);
        if (!e) continue;

        var a = e.select('a').first();
        if (!a) a = e;
        var img = e.select('img').first();
        var genreText = extractCardGenre(e, listGenre);
        var authorText = '';
        var authorEl = e.select('a[href*="/thanh-vien/"]').first();
        if (authorEl) authorText = authorEl.text().trim();
        var name = a.attr('title') || (a ? a.text().trim() : '');
        if (!name && img) name = img.attr('alt') || '';
        var link = normalizeUrl(a ? a.attr('href') : '');
        var cover = img ? (img.attr('src') || img.attr('data-src') || '') : '';
        
        if (!name || !link || link === BASE_URL || link === BASE_URL + '/') continue;
        
        comiclist.push({
            name: name,
            link: link,
            cover: normalizeUrl(cover),
            description: genreText || authorText || '',
            host: BASE_URL
        });
    }
    return comiclist;
}

function execute(url, page) {
    if (!page) page = '1';
    var response = fetchPage(url, {
        method: 'GET',
        queries: { page: page }
    });

    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var comiclist = [];
    var next = null;

    // Next page detection
    var nextAnchor = doc.select("a[aria-current='page'] + a, .my-5 nav a:contains(Tiếp), .my-5 nav a:last-child").first();
    if (nextAnchor) {
        var nextHref = nextAnchor.attr('href') || '';
        var nextMatch = nextHref.match(/page=(\d+)/) || nextHref.match(/\d+$/);
        if (nextMatch) next = nextMatch[1];
    }

    // Try DOM parsing
    comiclist = parseDomCards(doc, '');

    // Try JSON fallback
    if (comiclist.length === 0) {
        var nextData = doc.select('#__NEXT_DATA__').html();
        if (nextData) {
            try {
                var parsed = JSON.parse(nextData);
                collectFromNode(parsed, comiclist, {});
            } catch (e) {}
        }
    }

    return Response.success(comiclist, next);
}

