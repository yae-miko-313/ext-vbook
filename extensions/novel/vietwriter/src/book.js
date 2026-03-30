load('config.js');
function execute(url, page) {
    try {
        if (!page) page = "1";
        if (page !== "1") url = url.replace(/\/$/, "") + "/page-" + page;
        var res = fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return Response.success([]);
        var data = [];
        var doc = res.html();
        doc.select(".structItem--thread").forEach(function(e) {
            var titleLink = e.select(".structItem-title a[href*='threads/']").last();
            if (titleLink) {
                var name = titleLink.text().trim();
                var link = titleLink.attr("href").replace("/unread", "");
                if (link.indexOf("/") === 0) link = BASE_URL + link;
                var img = e.select(".structItem-cell--icon img, .structItem-icon img, .avatar img").first();
                var cover = img ? (img.attr("data-src") || img.attr("src")) : "https://i.imgur.com/15469.png";
                if (cover.indexOf("//") === 0) cover = "https:" + cover;
                var authorEl = e.select(".structItem-parts a.username").first();
                var author = authorEl ? authorEl.text().trim() : "Chưa rõ";
                data.push({ name: name, link: link, cover: cover, description: "Tác giả: " + author, host: BASE_URL });
            }
        });
        var next = doc.select(".pageNav-jump--next").first();
        return Response.success(data, next ? (parseInt(page) + 1).toString() : null);
    } catch (e) { return Response.success([]); }
}