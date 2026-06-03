load('bypass.js');
load('config.js');

function execute(key, page) {
    key = ((key || '') + '').trim();
    if (!key) return Response.success([], null);

    page = page ? (page + '') : '1';
    var url = BASE_URL + '/tim-kiem/trang-' + page + '?q=' + encodeURIComponent(key);
    var res = fetch(url, {
        headers: {
            'Referer': BASE_URL + '/tim-kiem?q=' + encodeURIComponent(key),
            'User-Agent': UserAgent.android()
        }
    });
    if (!res || !res.ok) return Response.error('Search failed: ' + (res ? res.status : 'no response'));

    var doc = bypass(url, res.html());
    if (!doc) return Response.success([], null);

    var data = parseSearchItems(doc);
    var next = parseNextPage(doc, page);
    return Response.success(data, next);
}

function parseSearchItems(doc) {
    var data = [];
    var seen = {};
    var items = doc.select('#main_homepage .list_grid li');
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        var linkEl = item.select('.book_name a[href]').first();
        if (!linkEl) continue;

        var link = normalizeUrl(linkEl.attr('href') + '');
        if (!link || seen[link]) continue;

        var name = cleanText(linkEl.text() + '');
        if (!name) continue;

        var img = item.select('.book_avatar img').first();
        var cover = img ? normalizeUrl(firstAttr(img, ['src', 'data-src', 'data-original', 'data-fb', 'data-ni'])) : '';
        var chapter = cleanText(item.select('.last_chapter').first().text() + '');
        var otherName = cleanText(item.select('.more-info .title-more-other').first().text() + '');
        var excerpt = cleanText(item.select('.more-info .excerpt').first().text() + '');

        var desc = [];
        if (otherName) desc.push(otherName);
        if (chapter) desc.push(chapter);
        if (excerpt) desc.push(excerpt);

        seen[link] = true;
        data.push({
            name: name,
            link: link,
            description: desc.join(' · '),
            cover: cover,
            host: BASE_URL
        });
    }
    return data;
}

function parseNextPage(doc, page) {
    var current = parseInt(page || '1', 10);
    if (isNaN(current)) current = 1;

    var links = doc.select('.page_redirect a[href]');
    var next = null;
    for (var i = 0; i < links.size(); i++) {
        var href = (links.get(i).attr('href') || '') + '';
        var match = href.match(/\/tim-kiem\/trang-(\d+)/);
        if (!match || !match[1]) continue;
        var value = parseInt(match[1], 10);
        if (!isNaN(value) && value > current && (next === null || value < next)) next = value;
    }
    return next !== null ? String(next) : null;
}

function firstAttr(el, names) {
    for (var i = 0; i < names.length; i++) {
        var value = (el.attr(names[i]) || '') + '';
        if (value && value.indexOf('data:image/') !== 0) return value;
    }
    return '';
}

function normalizeUrl(url) {
    url = ((url || '') + '').trim();
    if (!url) return '';
    if (url.indexOf('//') === 0) return 'https:' + url;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.charAt(0) === '/') return BASE_URL + url;
    return BASE_URL + '/' + url;
}

function cleanText(text) {
    return ((text || '') + '').replace(/\s+/g, ' ').trim();
}
