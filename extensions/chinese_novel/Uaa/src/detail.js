load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url);
    if (!response.ok) return Response.error(CF_MESSAGE);

    var doc = response.html();
    if (isCloudflare(doc)) return Response.error(CF_MESSAGE);

    var kind = urlKind(url);
    if (kind === "comic") {
        var comicName = doc.select(".cd-t4").text();
        var comicAuthor = doc.select(".cd-meta__author").first().text().replace(/\s*绘$/, "");
        return Response.success({
            name: comicName,
            cover: doc.select("[class^=cd-] img").attr("src"),
            author: comicAuthor,
            description: doc.select(".cd-syn").html(),
            detail: "书名：" + comicName + "<br>作者：" + (comicAuthor || "未知"),
            type: "comic",
            format: "comic",
            host: BASE_URL
        });
    }
    if (kind === "video") {
        var videoName = doc.select(".vd-title").text();
        var cast = doc.select("a.vd-cast__item").map(function (e) { return e.text(); });
        return Response.success({
            name: videoName,
            cover: doc.select("#uaaVideo").attr("poster"),
            author: cast.length ? cast[0] : "",
            description: doc.select(".vd-synopsis").html(),
            detail: "书名：" + videoName + "<br>作者：" + (cast.length ? cast.join(", ") : "未知"),
            type: "video",
            format: "clip",
            ongoing: false,
            host: BASE_URL
        });
    }

    var name = doc.select(".nd-t3").text();
    var author = doc.select(".nd-author__lk").text();
    var detail = ["书名：" + name, "作者：" + (author || "未知")];
    doc.select(".nd-info .nd-meta, .nd-info .nd-latest").forEach(function (e) {
        detail.push(e.text());
    });
    var stats = doc.select(".nd-stats .nd-stat");
    if (!stats.isEmpty()) {
        detail.push(stats.map(function (e) { return e.text(); }).join(" · "));
    }

    var genres = [];
    doc.select(".nd-info a.nd-meta__lk[href*=category=]").forEach(function (e) {
        genres.push({ title: e.text(), input: e.attr("href"), script: "updates.js" });
    });

    // Pill text glues the vote count onto the name ("#NTR10"), so read the tag from the href.
    doc.select(".nd-tagline a.nd-pill").forEach(function (e) {
        var m = String(e.attr("href")).match(/[?&]tag=([^&]+)/);
        if (!m) return;
        var tag = decodeURIComponent(m[1]);
        genres.push({ title: tag, input: tag, script: "cate.js" });
    });

    var novelId = getNovelId(url);
    var comments = [];
    if (novelId) {
        comments.push({
            title: "评论",
            input: BASE_URL + "/api/novel/app/novel/comments?novelId=" + novelId + "&sortType=1&page={{page}}&rows=10",
            script: "comment.js"
        });
    }

    return Response.success({
        name: name,
        cover: doc.select(".nd-cover img").attr("src"),
        author: author,
        description: doc.select(".nd-synopsis").html(),
        detail: detail.join("<br>"),
        ongoing: doc.select(".nd-cover__st").text().indexOf("完结") < 0,
        host: BASE_URL,
        genres: genres,
        comments: comments
    });
}

function getNovelId(url) {
    var m = (url || "").match(/[?&]id=(\d+)/);
    return m && m[1] ? m[1] : "";
}
