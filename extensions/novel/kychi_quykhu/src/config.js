var BASE_URL = 'https://quykhu.com';
var BASE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// Configuration override support
try {
    if (typeof CONFIG_URL !== 'undefined' && CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
    if (typeof CONFIG_UA !== 'undefined' && CONFIG_UA) {
        BASE_UA = CONFIG_UA;
    }
} catch (error) {
}

/**
 * Response object - Standard contract for vBook runtime
 */
var Response = {
    success: function(data, data2) {
        return JSON.stringify({ code: 0, data: data, data2: data2 });
    },
    error: function(data) {
        return JSON.stringify({ code: 1, data: data });
    }
};

/**
 * Normalize URL - Handle relative & absolute paths
 */
function normalizeUrl(href) {
    if (!href) return '';
    href = String(href).trim();
    if (href.indexOf('http') === 0) return href;
    if (href.indexOf('//') === 0) return 'https:' + href;
    if (href.charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

/**
 * Clean whitespace and HTML tags from text
 */
function cleanText(text) {
    if (!text) return '';
    return String(text).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Normalize status text
 */
function normalizeStatus(text) {
    if (!text) return 'Đang ra';
    var lower = String(text).toLowerCase();
    if (lower.indexOf('hoàn thành') >= 0 || lower.indexOf('đã hoàn') >= 0 || lower.indexOf('full') >= 0) {
        return 'Hoàn thành';
    }
    return 'Đang ra';
}

/**
 * Safe size check for Elements or Array
 */
function getSize(els) {
    if (!els) return 0;
    try {
        if (typeof els.size === 'function') return els.size();
        if (typeof els.size === 'number') return els.size;
        if (typeof els.length === 'number') return els.length;
    } catch (e) {}
    return 0;
}

/**
 * Safe element access
 */
function getElement(els, index) {
    if (!els || getSize(els) <= index) return null;
    try {
        if (typeof els.get === 'function') return els.get(index);
    } catch (e) {}
    return els[index];
}

/**
 * Load HTML document with fallback to headless browser
 */
function loadDocument(url, timeout, requiredSelector) {
    var response = fetchPage(url);
    if (response.ok) {
        var doc = response.html();
        if (doc) {
            if (!requiredSelector) return doc;
            var selected = doc.select(requiredSelector);
            if (getSize(selected) > 0) {
                return doc;
            }
        }
    }

    // Fallback: Headless browser for dynamic content
    if (typeof Engine !== 'undefined' && Engine && typeof Engine.newBrowser === 'function') {
        try {
            var browser = Engine.newBrowser();
            var page = browser.launch(url, timeout || 15000);
            if (page) {
                if (!requiredSelector) {
                    if (browser.close) try { browser.close(); } catch(e) {}
                    return page;
                }
                var selected = page.select(requiredSelector);
                if (getSize(selected) > 0) {
                    if (browser.close) try { browser.close(); } catch(e) {}
                    return page;
                }
            }
            if (browser.close) try { browser.close(); } catch(e) {}
        } catch (error) {
        }
    }

    return null;
}

/**
 * Fetch page with standard headers
 */
function fetchPage(url, options) {
    if (!options) options = {};
    var headers = {
        'User-Agent': BASE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8',
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


