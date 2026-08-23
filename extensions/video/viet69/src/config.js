let BASE_URL = "https://viet69.be";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (error) {
}

function normalizeUrl(url) {
    return url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
}

function parseItems(doc) {
    let items = [];
    doc.select("div.item-video").forEach(function (el) {
        let link = el.select("h2.entry-title a, h3.entry-title a").first();
        if (link === null) link = el.select("a.clip-link").first();
        if (link === null) return;
        let href = link.attr("href");
        if (!href) return;
        let title = link.attr("title").replace(/^Permalink to\s*/i, "");
        items.push({
            name: title || link.text(),
            cover: el.select("a.clip-link img").attr("src"),
            link: href,
            description: el.select("span.views i.count").text() + " lượt xem",
            tag: el.select("time.entry-date").text()
        });
    });
    return items;
}
