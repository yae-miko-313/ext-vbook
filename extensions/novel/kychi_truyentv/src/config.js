var BASE_URL = "https://www.tvtruyen.ink";
var BASE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

function normalizeUrl(u) {
    if (!u) return "";
    var url = String(u).trim();
    if (url.indexOf("//") === 0) {
        url = "https:" + url;
    } else if (url.indexOf("http") !== 0) {
        if (url.indexOf("/") === 0) url = BASE_URL + url;
        else url = BASE_URL + "/" + url;
    }
    return url.replace(/\/$/, "");
}

function cleanText(text) {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
}

function cleanHtml(htm) {
    if (!htm) return '';
    return htm
        .replace(/·/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/gi, '')
        .replace(/<\/p>\s*<p[^>]*>/gi, '<br>')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .trim();
}

function cleanDescription(htm) {
    if (!htm) return '';
    return htm
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .trim();
}

var Response = {
    success: function(data, data2) {
        return JSON.stringify({ code: 0, data: data, data2: data2 });
    },
    error: function(data) {
        return JSON.stringify({ code: 1, data: data });
    }
};
