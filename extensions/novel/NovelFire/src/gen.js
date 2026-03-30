function execute(url, page) {
    if(!page) page = '1';
    var res = fetch("https://novelfire.net" + url + "?page=" + page);
    if (!res.ok) return null;
    var doc = res.html('utf-8');
    var data = [];
    doc.select("ul.novel-list li").forEach(function(e) {
        var link = e.select("a").first().attr("href");
        if (link) {
            if (link.indexOf("http") !== 0) link = "https://novelfire.net" + (link.indexOf("/") === 0 ? "" : "/") + link;
            var cover = e.select("img").first().attr("data-src") || e.select("img").first().attr("src");
            if (cover && cover.indexOf("http") !== 0) cover = "https://novelfire.net" + (cover.indexOf("/") === 0 ? "" : "/") + cover;
            data.push({
                name: e.select("h4, .novel-title").first().text().trim(),
                link: link, cover: cover,
                description: e.select(".novel-stats, .stats").first().text().trim(),
                host: "https://novelfire.net"
            });
        }
    });
    var nextBtn = doc.select("ul.pagination li a.page-link").last();
    var next = (nextBtn && nextBtn.attr("href").indexOf("page=") !== -1) ? nextBtn.attr("href").split("page=")[1] : "";
    return Response.success(data, next);
}