function execute(url) {
    var res = fetch(url);
    if (!res.ok) return null;
    var doc = Html.parse(res.text());

    // 1. Dữ liệu định danh cơ bản
    var name = doc.select("meta[property='og:title']").attr("content");
    if (!name) name = doc.select("h1").first().text().trim();
    name = name.replace(/Truyện/gi, "").replace(/WebNovel\.vn/gi, "").replace(/\|[\s\S]*/, "").trim();

    var author = doc.select(".book-detail__author a, a[href*='/tac-gia/']").first().text().trim() || "@R";
    var cover = doc.select("meta[property='og:image']").attr("content") || doc.select("img").first().attr("src");

    // 2. THUẬT TOÁN HYBRID: BÓC TÁCH QUA ICON CLASS
    var chapters = "0";
    var wordCount = "0";
    var rating = "N/A";

    var statItems = doc.select(".book-detail__stat");
    for (var i = 0; i < statItems.size(); i++) {
        var item = statItems.get(i);
        var iconClass = item.select(".icon").attr("class") || "";
        var textVal = item.select(".book-detail__stat-text").text().trim();
        
        // icon--document = Số chương
        if (iconClass.indexOf("icon--document") > -1) {
            chapters = textVal.replace(/chương/gi, "").trim();
        }
        // icon--fire = Lượt chữ / Lượt thích / Độ hot
        if (iconClass.indexOf("icon--fire") > -1) {
            wordCount = textVal;
        }
        // icon--star = Điểm đánh giá (Dự phòng)
        if (iconClass.indexOf("icon--star") > -1) {
            rating = textVal;
        }
    }

    // Ghi đè Rating bằng khối chi tiết nếu có (Ví dụ: 3.6 / 5)
    var ratingDetail = doc.select(".rating-count").text();
    if (ratingDetail) {
        rating = ratingDetail.split("·")[0].trim();
    }

    // Fallback Regex nếu Website đổi cấu trúc DOM
    if (chapters === "0" || wordCount === "0") {
        var htmlBody = doc.html();
        if (chapters === "0") {
            var cMatch = htmlBody.match(/(\d+(?:[.,]\d+)?)\s*chương/i);
            if (cMatch) chapters = cMatch[1];
        }
        if (wordCount === "0") {
            var wMatch = htmlBody.match(/(\d+(?:[.,]\d+)*(?:K|M)?)\s*(chữ|từ|lượt thích|đề cử)/i);
            if (wMatch) wordCount = wMatch[1];
        }
    }

    // 3. Hệ thống Thể loại (Frozen - Không thay đổi)
    var genres = [];
    var genreEls = doc.select(".book-detail__genres a.genre, a[href*='/the-loai/']");
    for (var j = 0; j < genreEls.size(); j++) {
        var g = genreEls.get(j);
        var gTitle = g.text().trim();
        var gHref = g.attr("href");
        if (gTitle && gHref && gTitle.length < 25 && gTitle.toLowerCase() !== author.toLowerCase()) {
            gTitle = gTitle.replace(/(^\w|\s\w)/g, function(m) { return m.toUpperCase(); });
            genres.push({
                title: gTitle,
                input: gHref.indexOf("http") === 0 ? gHref : "https://webnovel.vn" + gHref,
                script: "gen.js"
            });
        }
    }

    // 4. KIẾN TRÚC UI: Khối thông tin hiển thị ngay sau Tên truyện
    var topDetail = "";
    topDetail += "✍️ Tác giả: " + author + "<br>";
    topDetail += "📑 Số chương: " + chapters + "<br>";
    topDetail += "📝 Số chữ: " + wordCount + "<br>";
    topDetail += "⭐ Xếp hạng: " + rating;

    // 5. KIẾN TRÚC UI: Khối giới thiệu (Chỉ chứa văn án thuần túy)
    var descEl = doc.select(".book-detail__summary").first();
    var desc = "";
    if (descEl) {
        desc = descEl.html()
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/(©|CÔNG TY|Vietnamese publication rights arranged)[\s\S]*/gi, "")
            .trim();
    }
    if (!desc) {
        desc = doc.select("meta[property='og:description']").attr("content") || "Đang cập nhật nội dung giới thiệu...";
        desc = desc.replace(/(©|Là website)[\s\S]*/gi, "").trim();
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        genres: genres,
        detail: topDetail,
        description: desc.replace(/\n+/g, "<br><br>"),
        host: "https://webnovel.vn"
    });
}
