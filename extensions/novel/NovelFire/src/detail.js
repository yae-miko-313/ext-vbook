function execute(url) {
    var res = fetch(url);
    if (!res.ok) return null;
    var doc = res.html('utf-8');
    var htmlText = doc.html();
    
    var name = doc.select("h1.novel-title").text().trim();
    var cover = doc.select("figure.cover img").first().attr("data-src") || doc.select("figure.cover img").first().attr("src");
    if (cover && cover.indexOf("http") !== 0) cover = "https://novelfire.net" + (cover.indexOf("/") === 0 ? "" : "/") + cover;
    
    // Bóc tách Tác giả và Link
    var authorA = doc.select(".author a").first();
    var authorLink = "";
    var author = "Unknown";
    
    if (authorA) {
        authorLink = authorA.attr("href");
        if (authorLink && authorLink.indexOf("http") !== 0) authorLink = "https://novelfire.net" + (authorLink.indexOf("/") === 0 ? "" : "/") + authorLink;
        author = authorA.text().trim();
    } else {
        var authorSpan = doc.select(".author span[itemprop='author']").first();
        if (authorSpan) author = authorSpan.text().trim();
    }

    var statsEl = doc.select(".header-stats strong");
    var chapters = statsEl.get(0) ? statsEl.get(0).text().trim().replace(/^\d+[\s.\-:]*(Chapter|Chương)/i, "$1").replace(/(Chapter\s*\d+[\s:.-]*)(?:Chapter\s*\d+[\s:.-]*)+/gi, "$1") : "N/A";
    var views = statsEl.get(1) ? statsEl.get(1).text().trim() : "N/A";
    var status = statsEl.get(3) ? statsEl.get(3).text().trim() : (statsEl.get(2) ? statsEl.get(2).text().trim() : "Ongoing");
    var rank = doc.select(".rating .score, .rating strong, span[itemprop='ratingValue']").first().text().trim();
    
    var cats = [];
    doc.select(".categories ul li a").forEach(function(e) { cats.push(e.text().trim()); });
    var catStr = cats.slice(0, 5).join(", ") + (cats.length > 5 ? " ...." : "");
    
    var info = [];
    if (authorLink) {
        // Biến Tác giả thành Link Lọc (có thể bấm vào ngay dưới tên truyện)
        info.push("👤 Tác giả: <a href='" + authorLink + "'>" + author + "</a>");
    } else {
        info.push("👤 Tác giả: " + author);
    }
    info.push("📖 Số chương: " + chapters);
    info.push("👁️ Lượt xem: " + views);
    info.push("👑 Ranking: " + (rank || "N/A"));
    info.push("📌 Trạng thái: " + status);
    info.push("🎭 Thể loại: " + catStr);
    
    var summary = doc.select("div.summary .content");
    if (!summary.html()) summary = doc.select(".summary .expand-wrapper");
    summary.select(".expand-btn, a.btn-more, a[data-toggle='expand']").remove();
    
    var descHtml = summary.html() ? summary.html().replace(/Show more/gi, "").trim() : "";
    var descText = summary.text().replace(/Show more/gi, "").trim();
    
    // Google Translate Introduction
    if (descText) {
        try {
            var transUrl = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=" + encodeURIComponent(descText);
            var transRes = fetch(transUrl);
            if (transRes.ok) {
                var transData = transRes.json();
                var translatedText = "";
                for (var i = 0; i < transData[0].length; i++) {
                    if (transData[0][i][0]) translatedText += transData[0][i][0];
                }
                if (translatedText) descHtml = translatedText.replace(/\n/g, "<br>");
            }
        } catch (e) {}
    }
    
    // Quét post_id
    var postId = "";
    var idMatch = htmlText.match(/(?:post_id|novelId|novel_id|data-novel-id)["'\s:=]+(\d+)/i);
    if (idMatch) postId = idMatch[1];
    
    // Cấu hình Native Tabs: Gợi ý
    var suggestsTabs = [];
    if (authorLink) {
        suggestsTabs.push({
            title: "Truyện cùng tác giả",
            input: authorLink.replace("https://novelfire.net", ""),
            script: "gen.js"
        });
    }
    if (postId) {
        suggestsTabs.push({
            title: "Có thể bạn sẽ thích",
            input: postId,
            script: "recommended.js"
        });
    }

    // Cấu hình Native Tabs: BÌNH LUẬN (Comment Array)
    var commentTabs = [];
    if (postId) {
        commentTabs.push({
            title: "Bình luận",
            input: postId,
            script: "comment.js"
        });
    }
    
    return Response.success({
        name: name, cover: cover, author: author,
        description: descHtml,
        detail: info.join("<br>"),
        host: "https://novelfire.net",
        suggests: suggestsTabs,
        comment: commentTabs // Kích hoạt tab Bình luận Native
    });
}
