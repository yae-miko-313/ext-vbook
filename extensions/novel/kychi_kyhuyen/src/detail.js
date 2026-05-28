load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không thể tải thông tin truyện: " + response.status);
    
    var doc = response.html();
    if (!doc) return Response.error("Không thể phân tích dữ liệu trang chi tiết");
    
    // Robust metadata parsing
    var name = cleanText(doc.select("meta[property='og:title']").attr("content"));
    if (!name) name = cleanText(doc.select(".media-body h1 span").last().text());
    if (!name) name = cleanText(doc.select("head > title").text());
    
    var cover = doc.select("meta[property='og:image']").attr("content");
    if (!cover) cover = doc.select(".media-left img.media-object").attr("src");
    cover = normalizeCoverUrl(cover);
    
    var author = doc.select("meta[property='book:author']").attr("content");
    if (!author) {
        var authorEl = doc.select(".media-body a[href*=/tac-gia/]").first();
        author = authorEl ? authorEl.text() : "";
    }
    author = cleanText(author) || "Đang cập nhật";
    
    var descriptionEl = doc.select(".story-detail .para").first();
    var description = "";
    if (descriptionEl) {
        description = descriptionEl.html();
        // Replace literal newlines with <br> tags, then strip duplicate spaces
        description = description.replace(/\r?\n/g, "<br>")
                                 .replace(/(?:<br>\s*){2,}/g, "<br><br>")
                                 .trim();
    }
    if (!description) {
        description = cleanText(doc.select("meta[property='og:description']").attr("content"));
    }
    
    var ongoing = doc.select(".story-stage").text().indexOf("Hoàn thành") === -1;
    
    var genres = [];
    var genreTexts = [];
    doc.select(".media-body a[href*=/tim-kiem?]").forEach(function(g) {
        var title = cleanText(g.text());
        var href = g.attr("href");
        if (title && href && title !== "Truyện convert" && title !== "Truyện dịch" && title !== "AI dịch" && title !== "Sáng tác" && title !== "TTV" && title !== "KH" && title !== "YY") {
            genres.push({
                title: title,
                input: normalizeUrl(href),
                script: "gen.js"
            });
            genreTexts.push(title);
        }
    });
    
    // Detail info text
    var detailText = "";
    detailText += "<p><strong>Tác giả:</strong> " + author + "</p>";
    detailText += "<p><strong>Trạng thái:</strong> " + (ongoing ? "Đang tiến hành" : "Hoàn thành") + "</p>";
    if (genreTexts.length > 0) {
        detailText += "<p><strong>Thể loại:</strong> " + genreTexts.join(", ") + "</p>";
    }
    
    // Suggestions
    var suggests = [];
    var authorEl = doc.select(".media-body a[href*=/tac-gia/]").first();
    if (authorEl) {
        var authorUrl = normalizeUrl(authorEl.attr("href"));
        if (authorUrl) {
            suggests.push({
                title: "Truyện cùng tác giả",
                input: authorUrl,
                script: "gen.js"
            });
        }
    }
    suggests.push({
        title: "Truyện mới cập nhật",
        input: BASE_URL + "/tim-kiem?page=",
        script: "gen.js"
    });
    
    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detailText,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        host: BASE_URL
    });
}
