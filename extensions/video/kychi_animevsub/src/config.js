var BASE_URL = 'https://animevsub.app';
var DEFAULT_REFERER = 'https://animevsub.app/';
var BASE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
    if (CONFIG_UA) {
        BASE_UA = CONFIG_UA;
    }
} catch (error) {
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
    if (url.indexOf('http') === 0) return url;
    if (url.indexOf('//') === 0) return 'https:' + url;
    if (url.indexOf('/') === 0) return BASE_URL + url;
    return BASE_URL + '/' + url;
}

function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
}
