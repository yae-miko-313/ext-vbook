// function execute
var BASE_URL = "https://kyhuyen.com";
var BASE_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";

function normalizeUrl(url) {
    if (!url) return "";
    url = String(url).trim();
    if (url.indexOf("http") === 0) return url;
    if (url.indexOf("//") === 0) return "https:" + url;
    if (url.indexOf("/") === 0) return BASE_URL + url;
    return BASE_URL + "/" + url;
}

function normalizeCoverUrl(cover) {
    if (!cover) return "";
    cover = normalizeUrl(cover);
    try {
        var urlObj = new URL(cover);
        urlObj.pathname = urlObj.pathname
            .split("/")
            .map(function(p) { return encodeURIComponent(p); })
            .join("/");
        return urlObj.toString();
    } catch (e) {
        return encodeURI(cover);
    }
}

function cleanText(text) {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
}

var Response = {
    success: function(data, data2) {
        return JSON.stringify({ code: 0, data: data, data2: data2 });
    },
    error: function(data) {
        return JSON.stringify({ code: 1, data: data });
    }
};

function getSize(els) {
    if (!els) return 0;
    try {
        if (typeof els.size === 'function') return els.size();
        if (typeof els.size === 'number') return els.size;
        if (typeof els.length === 'number') return els.length;
    } catch (e) {}
    return 0;
}

function getElement(els, index) {
    if (!els || getSize(els) <= index) return null;
    try {
        if (typeof els.get === 'function') return els.get(index);
    } catch (e) {}
    return els[index];
}

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

function loadDocument(url, timeout, requiredSelector) {
    var response = fetchPage(url);
    if (response.ok) {
        var doc = response.html();
        if (doc) {
            if (!requiredSelector) return doc;
            if (getSize(doc.select(requiredSelector)) > 0) return doc;
        }
    }
    // Fallback: Sử dụng Headless Browser nếu trang yêu cầu render JS phức tạp
    if (typeof Engine !== 'undefined' && Engine && typeof Engine.newBrowser === 'function') {
        try {
            var browser = Engine.newBrowser();
            var page = browser.launch(url, timeout || 15000);
            if (page) {
                if (!requiredSelector) {
                    if (browser.close) browser.close();
                    return page;
                }
                if (getSize(page.select(requiredSelector)) > 0) {
                    if (browser.close) browser.close();
                    return page;
                }
            }
            if (browser.close) browser.close();
        } catch (e) {}
    }
    return null;
}
