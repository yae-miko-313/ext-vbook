const BASE_URL = 'https://phimfun.net';

function normalizeUrl(url) {
    if (url.indexOf('http') !== 0) {
        return BASE_URL + (url.indexOf('/') === 0 ? '' : '/') + url;
    }
    return url;
}

function cleanText(text) {
    return (text || '')
        .replace(/\s+/g, ' ')
        .replace(/\u00a0/g, ' ')
        .trim();
}

function dedupeRepeatedTitle(text) {
    text = cleanText(text);
    var words = text.split(' ');
    if (words.length % 2 === 0 && words.length > 2) {
        var half = words.length / 2;
        var firstHalf = words.slice(0, half).join(' ');
        var secondHalf = words.slice(half).join(' ');
        if (firstHalf === secondHalf) {
            return firstHalf;
        }
    }
    var match = text.match(/^(.*?)\s*(?:[-–—|])\s*\1$/i);
    if (match && match[1]) {
        return cleanText(match[1]);
    }
    return text;
}

function parseCards(doc) {
    var list = [];
    doc.select(".MovieList li").forEach(function(el) {
        var title = dedupeRepeatedTitle(el.select(".Title").text());
        var linkEl = el.select("a").first();
        var link = linkEl ? linkEl.attr("href") : "";
        var cover = el.select("img").attr("src");
        var sub = cleanText(el.select(".TpTv").text() || el.select(".SubTitle").text());

        if (sub && title && (sub === title || sub.indexOf(title) === 0)) {
            sub = cleanText(sub.replace(title, ''));
            sub = sub.replace(/^[-:|\s]+/, '');
        }
        
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
    var next = doc.select(".pagination li.active + li a").first();
    if (next.length > 0) {
        return (parseInt(page) + 1).toString();
    }
    return null;
}
