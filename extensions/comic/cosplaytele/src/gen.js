load('config.js');

function normalizePath(url) {
    var path = (url || '/') + '';
    if (/^https?:\/\//.test(path)) path = path.replace(BASE_URL, '');
    if (!path.startsWith('/')) path = '/' + path;
    path = path.replace(/\?.*$/, '');
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path || '/';
}

function toAbsoluteUrl(url) {
    var u = (url || '') + '';
    if (!u) return '';
    if (u.startsWith('//')) return 'https:' + u;
    if (u.startsWith('http')) return u;
    if (!u.startsWith('/')) u = '/' + u;
    return BASE_URL + u;
}

function buildUrl(path, page) {
    var p = parseInt(page, 10);
    if (!(p > 0)) p = 1;

    if (path === '/') {
        return p === 1 ? (BASE_URL + '/') : (BASE_URL + '/page/' + p + '/');
    }

    return p === 1 ? (BASE_URL + path + '/') : (BASE_URL + path + '/page/' + p + '/');
}

function execute(url, page) {
    var p = page || '1';
    var path = normalizePath(url);
    var listUrl = buildUrl(path, p);

    var response = fetch(listUrl, { method: 'GET' });
    if (!response.ok) return Response.error('Failed to load list');

    var doc = response.html();
    var data = [];
    var seen = {};

    doc.select('#post-list .col.post-item').forEach(function(item) {
        var titleEl = item.select('.post-title a').first();
        if (!titleEl) return;

        var name = (titleEl.text() || '') + '';
        var link = (titleEl.attr('href') || '') + '';
        if (!name || !link) return;

        link = toAbsoluteUrl(link);
        if (seen[link]) return;
        seen[link] = true;

        var cover = '';
        var img = item.select('.box-image img').first();
        if (img) {
            cover = (img.attr('src') || img.attr('data-src') || img.attr('data-original') || '') + '';
            cover = toAbsoluteUrl(cover);
        }

        data.push({
            name: name,
            link: link,
            cover: cover
        });
    });

    var next = null;
    var nextEl = doc.select('a.next').first();
    if (nextEl) {
        var nextHref = (nextEl.attr('href') || '') + '';
        var match = nextHref.match(/\/page\/(\d+)\//);
        if (match && match[1]) next = match[1] + '';
    }

    return Response.success(data, next);
}
