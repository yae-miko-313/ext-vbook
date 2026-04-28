load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    
    // Fetch trực tiếp
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.7"
        }
    });
    
    if (!response.ok) {
        return Response.success({
            name: "Không thể tải",
            cover: "",
            author: "HHKUNGFU",
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
            author: "HHKUNGFU",
            description: "Không thể tải thông tin phim",
            detail: "",
            ongoing: false,
            genres: [],
            format: "series",
            host: BASE_URL
        });
    }
    
    // Get title
    var ogTitle = doc.select("meta[property='og:title']").first();
    var nameText = ogTitle ? ogTitle.attr("content") : "";
    if (!nameText) {
        var h1 = doc.select("h1.entry-title").first();
        nameText = h1 ? cleanText(h1.text()) : "";
    }
    // Clean up title
    nameText = nameText.replace(/\s*-\s*Hoạt Hình 3D.*$/i, "").replace(/\s*\|\s*HHKUNGFU.*$/i, "").trim();
    
    // Get original title
    var orgTitle = doc.select("h2.org_title").first();
    var originalTitle = orgTitle ? cleanText(orgTitle.text()) : "";
    
    // Get cover
    var cover = "";
    var ogImage = doc.select("meta[property='og:image']").first();
    cover = ogImage ? ogImage.attr("content") : "";
    if (!cover) {
        var coverImg = doc.select("img.film-poster-img, img.wp-post-image").first();
        cover = coverImg ? (coverImg.attr("src") || coverImg.attr("data-src") || "") : "";
    }
    
    // Get description
    var description = "";
    var ogDesc = doc.select("meta[property='og:description']").first();
    description = ogDesc ? ogDesc.attr("content") : "";
    if (!description) {
        var metaDesc = doc.select("meta[name='description']").first();
        description = metaDesc ? metaDesc.attr("content") : "";
    }
    
    // Get genres
    var genres = [];
    doc.select(".list_cate a, a[rel='tag']").forEach(function(a) {
        var genreText = cleanText(a.text());
        var genreHref = a.attr("href") || "";
        if (genreText && genreHref.indexOf("/category/") >= 0) {
            genres.push({
                title: genreText,
                input: genreHref.indexOf("http") === 0 ? genreHref : BASE_URL + genreHref,
                script: "gen.js"
            });
        }
    });
    
    // Get status
    var statusText = "";
    var newEp = doc.select(".new-ep").first();
    if (newEp) {
        statusText = cleanText(newEp.text());
    }
    var ongoing = statusText.toLowerCase().indexOf("hoàn") < 0 && 
                   statusText.toLowerCase().indexOf("full") < 0 &&
                   statusText.toLowerCase().indexOf("trailer") < 0;
    
    // Build detail info
    var detailParts = [];
    if (originalTitle) {
        detailParts.push("Tên gốc: " + originalTitle);
    }
    
    var newEpDiv = doc.select(".hh3d-new-ep").first();
    if (newEpDiv) {
        detailParts.push(cleanText(newEpDiv.text()).replace("Tập mới nhất:", "Tập mới nhất: "));
    }
    
    doc.select(".hh3d-info").forEach(function(el) {
        var t = cleanText(el.text());
        t = t.replace("Tình trạng:", "Tình trạng: ").replace("Lượt xem:", "Lượt xem: ");
        detailParts.push(t);
    });
    
    var rateDiv = doc.select(".hh3d-rate .kksr-legend").first();
    if (rateDiv) {
        detailParts.push("Đánh giá: " + cleanText(rateDiv.text()));
    }
    
    // Build suggests - chỉ Top xem nhiều
    var suggests = [{
        title: "Top xem nhiều",
        input: BASE_URL + "/top-xem-nhieu/",
        script: "gen.js"
    }];
    
    return Response.success({
        name: nameText,
        cover: cover,
        author: "HHKUNGFU",
        description: description,
        detail: detailParts.join("<br>"),
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        format: "series",
        host: BASE_URL
    });
}
