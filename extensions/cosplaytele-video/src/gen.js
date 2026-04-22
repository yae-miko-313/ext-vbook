load("config.js");

function normalizeLink(link) {
    if (!link) return "";
    link = link + "";
    if (link.startsWith("//")) return "https:" + link;
    if (link.startsWith("/")) return BASE_URL + link;
    if (!link.startsWith("http")) return BASE_URL + "/" + link;
    return link;
}

function execute(url, page) {
    page = page || "1";
    var p = parseInt(page, 10);
    if (!(p > 0)) p = 1;

    var pageUrl;
    if (p === 1) {
        pageUrl = BASE_URL + "/category/video-cosplayy/";
    } else {
        pageUrl = BASE_URL + "/category/video-cosplayy/page/" + p + "/";
    }

    var res = fetch(pageUrl, { method: "GET" });
    if (!res.ok) return Response.error("Cannot load: " + res.status);

    var doc = res.html();
    var data = [];
    var seen = {};

    doc.select("#post-list .col.post-item").forEach(function(el) {
        var titleEl = el.select(".post-title a").first();
        if (!titleEl) return;

        var name = (titleEl.text() || "") + "";
        var link = normalizeLink(titleEl.attr("href") + "");
        if (!name || !link || seen[link]) return;
        seen[link] = true;

        var img = el.select(".box-image img").first();
        var cover = "";
        if (img) {
            cover = (img.attr("data-src") || img.attr("data-lazy-src") || img.attr("src") || "") + "";
            cover = normalizeLink(cover);
        }

        data.push({
            name: name,
            link: link,
            cover: cover,
            host: BASE_URL
        });
    });

    var next = "";
    var nextEl = doc.select(".nav-pagination a.next").first();
    if (!nextEl) nextEl = doc.select("a.next").first();
    if (nextEl) {
        var nextHref = nextEl.attr("href") + "";
        var m = nextHref.match(/\/page\/(\d+)\//);
        if (m && m[1]) next = m[1] + "";
    }

    return Response.success(data, next);
}