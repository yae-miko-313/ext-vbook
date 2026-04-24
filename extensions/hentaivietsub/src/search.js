load("config.js");

function buildSearchUrl(key, page) {
    var q = (key || "") + "";
    q = q.replace(/\s+/g, " ").trim();
    var slug = q.replace(/\s+/g, "-").toLowerCase();
    var url = BASE_URL + "/tim-kiem/" + encodeURIComponent(slug);
    if (page !== "1") url = url + "?page=" + page;
    return url;
}

function parsePage(doc, currentPage) {
    var data = [];
    var seen = {};

    doc.select("a[href*='/hentai/']").forEach(function(a) {
        var href = (a.attr("href") || "") + "";
        if (!href || href.indexOf("/hentai/") === -1) return;
        href = normalizeLink(href);
        if (seen[href]) return;

        var img = a.select("img").first();
        var name = (a.attr("title") || "") + "";
        if (!name && img) name = (img.attr("alt") || "") + "";
        if (!name) name = (a.text() || "") + "";
        name = name.replace(/\s+/g, " ").trim();
        if (!name) return;

        var cover = "";
        if (img) {
            cover = (img.attr("data-src") || img.attr("src") || "") + "";
            cover = normalizeLink(cover);
        }

        seen[href] = true;
        data.push({
            name: name,
            link: href,
            cover: cover,
            description: "",
            host: BASE_URL
        });
    });

    var nextNumber = 0;
    doc.select("a[href*='page=']").forEach(function(a) {
        var href = (a.attr("href") || "") + "";
        var m = href.match(/[?&]page=(\d+)/i);
        if (!m || !m[1]) return;
        var p = parseInt(m[1], 10);
        if (!(p > currentPage)) return;
        if (nextNumber === 0 || p < nextNumber) nextNumber = p;
    });

    var next = nextNumber > 0 ? String(nextNumber) : null;
    return { data: data, next: next };
}

function execute(key, page) {
    page = page || "1";
    var currentPage = parseInt(page, 10);
    if (!(currentPage > 0)) {
        currentPage = 1;
        page = "1";
    }

    var pageUrl = buildSearchUrl(key, page);
    var res = fetch(pageUrl, { method: "GET" });
    if (!res.ok) return Response.error("Search failed: " + res.status);

    var doc = res.html();
    var parsed = parsePage(doc, currentPage);
    return Response.success(parsed.data, parsed.next);
}