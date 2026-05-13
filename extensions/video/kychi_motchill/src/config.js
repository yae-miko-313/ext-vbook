var BASE_URL = 'https://envasion.net';

function normalizeUrl(url) {
    if (!url) return '';
    if (url.indexOf('http') !== 0) {
        if (url.indexOf('//') === 0) return 'https:' + url;
        if (url.indexOf('/') === 0) return BASE_URL + url;
        return BASE_URL + '/' + url;
    }
    return url;
}


function cleanText(text) {
    return (text || '')
        .replace(/\s+/g, ' ')
        .replace(/\u00a0/g, ' ')
        .trim();
}

function parseCards(doc) {
    var list = [];
    doc.select("article").forEach(function(el) {
        var titleEl = el.select("h3, .heading");
        var linkEl = el.select("a").first();
        var imgEl = el.select("img").first();
        var subEl = el.select(".sub-title, .year, .episodes");
        
        if (!titleEl || !linkEl) return;
        
        var title = titleEl.text().trim();
        if (!title) return;
        
        var link = linkEl.attr("href") || "";
        var cover = imgEl ? imgEl.attr("src") : "";
        var sub = subEl ? subEl.text().trim() : "";
        
        list.push({
            name: title,
            link: normalizeUrl(link),
            cover: normalizeUrl(cover),
            description: sub,
            host: BASE_URL
        });
    });
    return list;
}

function getNextPage(doc, page) {
    var next = doc.select(".pagination .next, .pagination a[rel='next']").first();
    if (next && next.attr("href")) {
        try {
            var nextPageNum = parseInt(page) + 1;
            return nextPageNum.toString();
        } catch(e) {}
    }
    return null;
}
