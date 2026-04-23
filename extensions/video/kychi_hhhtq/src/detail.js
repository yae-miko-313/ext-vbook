load('config.js');

// Detail page: https://hhhtq.team/phim/{id}/
// Từ research HTML: description trong og:description, tập phim trong title/description, episodes trong .tab-content
function execute(url) {
    url = normalizeUrl(url);
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": BASE_URL + "/"
        }
    });
    
    if (!response.ok) {
        return Response.success({
            name: "Không thể tải",
            cover: "",
            author: "HHHTQ",
            description: "Không thể tải thông tin phim",
            detail: "",
            ongoing: false,
            genres: [],
            format: "series",
            host: BASE_URL
        });
    }
    
    var doc = response.html();
    if (!doc) {
        return Response.success({
            name: "Không thể tải",
            cover: "",
            author: "HHHTQ",
            description: "Không thể tải thông tin phim",
            detail: "",
            ongoing: false,
            genres: [],
            format: "series",
            host: BASE_URL
        });
    }

    // --- Metadata cơ bản ---
    // Ưu tiên og:title cho tên chính xác
    var ogTitle = doc.select("meta[property='og:title']").first();
    var nameText = ogTitle ? ogTitle.attr("content") : "";
    
    // Fallback: tìm h1 hoặc title khác
    if (!nameText) {
        var name = doc.select("h1.title, h1, .movie-title, .film-title").first();
        nameText = name ? name.text().trim() : "";
    }
    
    // Loại bỏ các hậu tố không cần thiết như "Server X | HHHTQ"
    nameText = nameText.replace(/\s*Server\s+\d+.*$/i, "").replace(/\s*\|\s*HHHTQ.*$/i, "").trim();

    // Ảnh: ưu tiên og:image
    var ogImage = doc.select("meta[property='og:image']").first();
    var cover = ogImage ? ogImage.attr("content") : "";
    
    // Fallback: tìm thumb background
    if (!cover) {
        var thumbEl = doc.select(".myui-vodlist__thumb, .thumb a[style*='url']").first();
        if (thumbEl) {
            var style = thumbEl.attr("style") || "";
            var bgMatch = style.match(/url\((['"]?)(.*?)\1\)/);
            if (bgMatch) cover = bgMatch[2];
        }
    }
    
    // Fallback: tìm img thông thường
    if (!cover) {
        var coverEl = doc.select(".thumb img, .movie-thumb img, .poster img, .film-poster img, .detail-thumb img").first();
        if (coverEl) {
            cover = coverEl.attr("src") || coverEl.attr("data-src") || coverEl.attr("data-original") || "";
        }
    }

    // Description: ưu tiên og:description
    var ogDesc = doc.select("meta[property='og:description']").first();
    var description = ogDesc ? ogDesc.attr("content") : "";
    
    // Fallback: tìm trong content
    if (!description) {
        var descEl = doc.select(".description, .film-description, .content p, .entry-content p, .movie-desc").first();
        description = descEl ? descEl.text().trim() : "";
    }
    
    // Fallback: meta description
    if (!description) {
        var metaDesc = doc.select("meta[name=description]").first();
        description = metaDesc ? metaDesc.attr("content") || "" : "";
    }

    // --- Detail info ---
    var detail = [];
    var infoRows = doc.select(".film-info dl, .movie-info dl, table.info tr, .detail-info li");
    infoRows.forEach(function(row) {
        var label = row.select("dt, th, .label").first();
        var value = row.select("dd, td, .value").first();
        if (label && value) {
            var labelText = label.text().trim();
            var valueText = value.text().trim();
            if (labelText && valueText) {
                detail.push(labelText + ": " + valueText);
            }
        }
    });

    // --- Trạng thái phim ---
    var statusEl = doc.select(".status, .film-status, .ep-status").first();
    var statusText = statusEl ? statusEl.text().trim() : "";
    var ongoing = statusText.toLowerCase().indexOf("hoàn") < 0 && statusText.toLowerCase().indexOf("full") < 0;

    // --- Genres ---
    var genres = [];
    doc.select(".genres a, .film-genre a, .type a").forEach(function(a) {
        genres.push({
            title: a.text().trim(),
            input: a.attr("href") || "",
            script: "gen.js"
        });
    });

    return Response.success({
        name: nameText,
        cover: cover,
        author: "HHHTQ",
        description: description,
        detail: detail.join("<br>"),
        ongoing: ongoing,
        genres: genres,
        format: "series",
        host: BASE_URL
    });
}
