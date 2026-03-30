load('config.js');
function execute(url) {
    try {
        var res = fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) return null;
        var d = res.html();
        var titleVal = d.select("h1.p-title-value");
        titleVal.select(".label").remove();
        var name = titleVal.text().trim().replace(/^(Hot|New|Full|Hoàn thành|Hoàn)\s*\-?\s*/i, "").replace(/^\[.*?\]\s*/g, "").replace(/^\(.*?\)\s*/g, "").trim();
        var authorEl = d.select(".message-userDetails .username, .p-description a.username").first();
        var author = authorEl ? authorEl.text().trim() : "Chưa rõ";
        var genres = [], seenGenres = {};
        d.select(".p-breadcrumbs a").forEach(function(e) {
            var t = e.text().trim();
            var link = e.attr("href");
            if (t && t !== "Trang chủ" && t !== "Diễn đàn" && t !== "Thư Viện Truyện" && !seenGenres[t]) {
                seenGenres[t] = true;
                if (link.indexOf("/") === 0) link = BASE_URL + link;
                genres.push({ title: t, input: link, script: "book.js" });
            }
        });
        d.select(".tagList a.tagItem, .p-description a[href*='tags/']").forEach(function(e) {
            var t = e.text().trim();
            var link = e.attr("href");
            if (t && !seenGenres[t]) {
                seenGenres[t] = true;
                if (link.indexOf("/") === 0) link = BASE_URL + link;
                genres.push({ title: t, input: link, script: "book.js" });
            }
        });
        var htmlContent = d.html() || "";
        var status = htmlContent.indexOf("Hoàn thành") !== -1 ? "Hoàn thành" : "Đang ra";
        var chapCount = "";
        var chapMatch = htmlContent.match(/tất cả\s*([\d,.]+)\s*chương/i);
        if (chapMatch && chapMatch[1]) chapCount = chapMatch[1];
        var detailInfo = [];
        detailInfo.push("Tác giả: " + author);
        detailInfo.push("Tình trạng: " + status);
        detailInfo.push("Nguồn: VietWriter");
        if (chapCount) detailInfo.push("Số chương: " + chapCount + " chương");
        var coverEl = d.select("dl[data-field='anhbia'] img").first() || d.select(".message-body .bbWrapper img").first();
        var cover = coverEl ? coverEl.attr("src") : d.select("meta[property='og:image']").attr("content");
        if (!cover || cover.indexOf("default") !== -1 || cover.indexOf("logo") !== -1) cover = "https://i.imgur.com/15469.png";
        else if (cover.indexOf("//") === 0) cover = "https:" + cover;
        else if (cover.indexOf("/") === 0) cover = BASE_URL + cover;
        var introEl = d.select(".message-body .bbWrapper").first();
        if (introEl) { var firstImg = introEl.select("img").first(); if (firstImg) firstImg.remove(); }
        return Response.success({ name: name, cover: cover, author: author, description: introEl ? introEl.html().trim() : "Đang cập nhật giới thiệu...", detail: detailInfo.join("<br>"), genres: genres, ongoing: status !== "Hoàn thành", host: BASE_URL });
    } catch(e) { return null; }
}