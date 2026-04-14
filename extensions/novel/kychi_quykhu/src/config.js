var BASE_URL = 'https://quykhu.com';
var BASE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
    if (CONFIG_UA) {
        BASE_UA = CONFIG_UA;
    }
} catch (error) {
}

function normalizeLink(href) {
    if (!href) return '';
    if (href.indexOf('http') === 0) return href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

function loadDocument(url, timeout, requiredSelector) {
    var response = fetchPage(url);
    if (response.ok) {
        var doc = response.html();
        if (doc && typeof doc.select === 'function') {
            if (!requiredSelector || doc.select(requiredSelector).length > 0) {
                return doc;
            }
        }
    }

    if (typeof Engine !== 'undefined' && Engine && typeof Engine.newBrowser === 'function') {
        try {
            var browser = Engine.newBrowser();
            var page = browser.launch(url, timeout || 10000);
            if (browser && typeof browser.close === 'function') {
                try {
                    browser.close();
                } catch (closeError) {
                }
            }
            if (page && typeof page.select === 'function') {
                if (!requiredSelector || page.select(requiredSelector).length > 0) {
                    return page;
                }
            }
            if (page && typeof page.html === 'function') {
                var htmlDoc = page.html();
                if (htmlDoc && typeof htmlDoc.select === 'function') {
                    if (!requiredSelector || htmlDoc.select(requiredSelector).length > 0) {
                        return htmlDoc;
                    }
                }
            }
        } catch (error) {
        }
    }

    return null;
}

function normalizeStatus(text) {
    if (!text) return '';
    var lower = String(text).toLowerCase();
    if (lower.indexOf('hoàn thành') >= 0 || lower.indexOf('đã hoàn') >= 0 || lower.indexOf('full') >= 0) return 'Hoàn thành';
    if (lower.indexOf('đang ra') >= 0 || lower.indexOf('đang cập nhật') >= 0 || lower.indexOf('đang tiến hành') >= 0) return 'Đang ra';
    return String(text).trim();
}

function fetchPage(url, options) {
    if (!options) options = {};
    var headers = {
        'User-Agent': BASE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': BASE_URL + '/'
    };
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }
    options.headers = headers;
    return fetch(url, options);
}
