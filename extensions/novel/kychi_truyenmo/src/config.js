var BASE_URL = 'https://www.truyenmo.com';
var BASE_UA = 'Mozilla/5.0 (Linux; Android 12; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36';

try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
    if (CONFIG_UA) {
        BASE_UA = CONFIG_UA;
    }
} catch (error) {
}

var BASE_ORIGIN = String(BASE_URL || '').replace(/\/+$/, '');

if (typeof Response === 'undefined') {
    var Response = {
        success: function(data, data2) {
            return JSON.stringify({ code: 0, data: data, data2: data2 });
        },
        error: function(data) {
            return JSON.stringify({ code: 1, data: data });
        }
    };
}

function fetchPage(url, options) {
    if (!options) options = {};

    var headers = {
        'User-Agent': BASE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    };

    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }

    options.headers = headers;
    return fetch(url, options);
}

function normalizeUrl(url) {
    if (!url) return '';
    url = String(url).trim();
    if (!url) return '';

    if (url.indexOf('//') === 0) url = 'https:' + url;
    if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
        return url.replace(/([^:]\/)\/+/g, '$1');
    }

    if (url.charAt(0) === '/') return (BASE_ORIGIN + url).replace(/([^:]\/)\/+/g, '$1');
    return (BASE_ORIGIN + '/' + url).replace(/([^:]\/)\/+/g, '$1');
}

function buildPageUrl(url, page) {
    url = normalizeUrl(url);
    page = String(page || '1');
    if (page === '1') return url;

    if (/[?&]page=\d+/i.test(url)) {
        return url.replace(/([?&]page=)\d+/i, '$1' + page);
    }

    if (url.indexOf('/tim-kiem') >= 0 || url.indexOf('?') >= 0) {
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
    }

    if (/\/trang-\d+\.html$/i.test(url)) {
        return url.replace(/\/trang-\d+\.html$/i, '/trang-' + page + '.html');
    }

    if (/\.html$/i.test(url)) {
        return url.replace(/\.html$/i, '/trang-' + page + '.html');
    }

    return url.replace(/\/+$/, '') + '/trang-' + page + '.html';
}

function cleanText(text) {
    if (!text) return '';
    return String(text).replace(/\s+/g, ' ').trim();
}

function extractPageToken(nextUrl, fallbackText) {
    var href = String(nextUrl || '');
    var m = href.match(/[?&]page=(\d+)/i);
    if (m) return m[1];
    m = href.match(/\/trang-(\d+)\.html/i);
    if (m) return m[1];

    var txt = cleanText(fallbackText || '');
    if (/^\d+$/.test(txt)) return txt;
    return txt;
}

function detectNextPage(doc) {
    var nextEl = doc.select('.pagination li.active + li a, .pagination .active + li a, .pagination a[rel="next"]').first();
    if (!nextEl) return '';
    return extractPageToken(nextEl.attr('href'), nextEl.text());
}

function collectStoryCards(items, data, seen) {
    items.forEach(function(e) {
        var link = e.select('a[href*=".html"]').first();
        if (!link) link = e.select('h3 a[href], h2 a[href], a[href]').first();
        if (!link) return;

        var href = normalizeUrl(link.attr('href'));
        if (!href || seen[href]) return;
        seen[href] = true;

        var title = cleanText(link.text());
        if (!title) {
            var titleEl = e.select('.single-story-details h3, .single-story-title, .story-title, .card-title, .story-item-title, h3, h4, h5, h6, h2').first();
            title = titleEl ? cleanText(titleEl.text()) : '';
        }
        if (!title) return;

        var cover = '';
        var img = e.select('img').first();
        if (img) {
            cover = img.attr('data-src') || img.attr('src') || '';
            cover = normalizeUrl(cover);
        }

        var description = '';
        var descEl = e.select('.chapter, .last_chapter, .chapter-title, .single-story-details .last_chapter').first();
        if (descEl) description = cleanText(descEl.text());

        data.push({
            name: title,
            link: href,
            cover: cover,
            description: description,
            host: BASE_URL
        });
    });
}

function extractBeforeContentMap(rawHtml) {
    var map = {};
    var html = String(rawHtml || '');
    if (!html) return map;

    var regex = /\.([a-zA-Z0-9\-_]+):before\s*\{\s*content:\s*"([^"]*)"\s*;?\s*\}/g;
    var match;
    while ((match = regex.exec(html)) !== null) {
        var cls = match[1];
        var txt = match[2] || '';
        txt = txt.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, ' ').replace(/\\r/g, '');
        map[cls] = txt;
    }

    return map;
}

function decodeObfuscatedSpan(content, map) {
    var html = String(content || '');
    if (!html || !map) return html;

    return html.replace(/<span[^>]*class="([^"]+)"[^>]*><\/span>/gi, function(_, clsNames) {
        var classes = String(clsNames || '').split(/\s+/);
        for (var i = 0; i < classes.length; i++) {
            var key = classes[i];
            if (map[key] !== undefined) return map[key];
        }
        return '';
    });
}