let BASE_URL = 'https://www.uaa.com';
try {
    if (CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {
}

var CF_MESSAGE = "Mở browser lên mà verify Cloudflare đi bạn ơi";

function normalizeUrl(url) {
    url = String(url || "").trim();
    if (url.indexOf("//") === 0) url = "https:" + url;
    if (!/^https?:\/\//i.test(url)) return BASE_URL + (url.charAt(0) === "/" ? "" : "/") + url;
    return url.replace(/^https?:\/\/[^\/?#]+/i, BASE_URL);
}

function isCloudflare(doc) {
    return doc.select("#cf-error-details, .cf-browser-verification, #challenge-form, #challenge-error-text").size() > 0;
}

function parseCards(doc) {
    var data = [];
    doc.select("a.cn-lcard").forEach(function (e) {
        data.push({
            name: e.select(".cn-lcard__t").text(),
            link: normalizeUrl(e.attr("href")),
            cover: e.select(".cn-lcard__cv img").attr("src"),
            description: e.select(".cn-lcard__byname").text().replace(/\s*著$/, ""),
            host: BASE_URL
        });
    });
    return data;
}

// Next page from the wall's server-rendered pager attributes; "" when on the last page.
function nextPage(doc, page) {
    var wall = doc.select("#wall");
    var total = parseInt(wall.attr("data-total-page"), 10) || 0;
    var current = parseInt(page, 10) || 1;
    return current < total ? String(current + 1) : "";
}
