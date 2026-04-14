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

function genreFromListUrl(url) {
    var m = String(url || '').match(/\/the-loai\/([^\/?#]+)/i);
    if (!m) return '';
    return slugToTitle(m[1]);
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

    if (title && slug && typeof title === 'string' && typeof slug === 'string') {
        var path = slug.indexOf('/truyen/') >= 0 ? slug : '/truyen/' + slug.replace(/^\/+/, '');
        var link = normalizeLink(path);
        if (!seen[link]) {
            seen[link] = true;
            out.push({
                name: String(title).trim(),
                link: link,
                cover: String(cover || ''),
                description: String(intro || ''),
                host: BASE_URL
            });
        }
    }

    for (var key in node) {
        if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
        collectFromNode(node[key], out, seen);
    }
}

function execute(url, page) {
    if (!page) page = '1';
    var response = fetchPage(url, {
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

    var nextHref = doc.select("a[aria-current='page'] + a").attr('href');
    if (!nextHref) {
        var nextAnchor = doc.select('.my-5 nav a').last();
        if (nextAnchor) nextHref = nextAnchor.attr('href');
    }
    if (nextHref) {
        var nextMatch = nextHref.match(/\d+$/);
        if (nextMatch) next = nextMatch[0];
    }

    var listGenre = genreFromListUrl(url);
    var cards = doc.select('#postTabsContent .group.flex.items-start');
    if (cards.size() === 0) {
        cards = doc.select('#postTabsContent a.relative.shrink-0, .container .mb-3 .mx-auto .flex, .container .mb-3 .mx-auto .transform, .list-truyen .row');
    }

    cards.forEach(function(e) {
        var a = e.select('a').first();
        if (!a) a = e;
        var img = e.select('img').first();
        var genreText = extractCardGenre(e, listGenre);
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

    if (comiclist.length === 0) {
        var nextData = doc.select('#__NEXT_DATA__').html();
        if (nextData) {
            try {
                var parsed = JSON.parse(nextData);
                collectFromNode(parsed, comiclist, {});
            } catch (e2) {
            }
        }
    }

    if (comiclist.length === 0) {
        var seen = {};
        doc.select('a[href]').forEach(function(a) {
            var href = normalizeLink(a.attr('href') || '');
            if (!href || seen[href]) return;

            if (href.indexOf(BASE_URL + '/') !== 0) return;
            var rel = href.substring(BASE_URL.length);
            if (rel.charAt(0) !== '/') return;
            var parts = rel.split('/').filter(function(x) { return x; });
            if (parts.length !== 1) return;

            var slug = parts[0].toLowerCase();
            var blocked = {
                '': true,
                'login': true,
                'hoan-thanh': true,
                'yeu-thich': true,
                'xem-nhieu': true,
                'moi-nhat': true,
                'kim-thanh-bang': true
            };
            if (blocked[slug]) return;

            var title = (a.attr('title') || a.text() || '').trim();
            if (!title) {
                var h = a.select('h1, h2, h3, h4').first();
                title = h ? h.text().trim() : '';
            }
            if (!title || title.length < 2) return;

            var img = a.select('img').first();
            var cover = img ? (img.attr('src') || img.attr('data-src') || '') : '';
            if (cover.indexOf('//') === 0) cover = 'https:' + cover;

            seen[href] = true;
            comiclist.push({
                name: title,
                link: href,
                cover: cover,
                description: '',
                host: BASE_URL
            });
        });
    }

    return Response.success(comiclist, next);
}
