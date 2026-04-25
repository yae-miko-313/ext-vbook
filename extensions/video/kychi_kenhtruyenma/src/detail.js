load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": BASE_URL + "/"
        }
    });
    
    if (!response.ok) return Response.error("Không thể tải thông tin");
    
    var doc = response.html();
    var html = response.text();
    if (!doc) return Response.error("Không thể phân tích trang");
    
    var nameText = "";
    var titleEl = doc.select("h1.de_title.comictitle").first();
    if (titleEl) {
        nameText = titleEl.text().replace(/Nghe\s*Truyện Ma\s*/i, "").trim();
    }
    
    if (!nameText) {
        var ogTitle = doc.select("meta[property='og:title']").first();
        if (ogTitle) nameText = ogTitle.attr("content") || "";
    }
    
    if (!nameText) {
        var h1 = doc.select("h1.de_title").first();
        if (h1) nameText = cleanText(h1.text());
    }
    
    nameText = nameText.replace(/^Nghe\s+/, "").replace(/\s*-\s*Kênh Truyện Ma.*$/i, "").replace(/\s*-\s*Kenh Truyen Ma.*$/i, "").trim();
    
    var cover = "";
    var ogImage = doc.select("meta[property='og:image']").first();
    if (ogImage) cover = ogImage.attr("content") || "";
    
    if (!cover) {
        var imgLoad = doc.select(".img_load img").first();
        if (imgLoad) cover = imgLoad.attr("src") || "";
    }
    
    var description = "";
    var ogDesc = doc.select("meta[property='og:description']").first();
    if (ogDesc) description = ogDesc.attr("content") || "";
    
    var genres = [];
    var seen = {};
    // Select all links in .cti_comic that are categories (not giọng đọc)
    doc.select(".cti_comic a[href]").forEach(function(a) {
        var title = cleanText(a.text());
        var href = a.attr("href") || "";
        if (!title || !href) return;
        
        // Skip tag links and giọng đọc links
        if (href.indexOf("/tag/") >= 0 || href.indexOf("/giong-doc/") >= 0) return;
        if (href.indexOf("moi-dang") >= 0 || href.indexOf("moi-cap-nhat") >= 0) return;
        
        // Only keep category links: contains /truyen-, /kiem-hiep, /ngon-tinh, /sach-noi, etc.
        var isCategory = href.match(/\/(truyen-|kiem-hiep|ngon-tinh|sach-noi\/|van-hoc|tinh-yeu|radio|lich-su|trinh-tham|ngan|dai|audio|kinh-dien|cuoi|do-thi|trong-sinh|huyen-huyen|xuyen-khong|phat-giao|quan-su|tam-ly)/);
        if (!isCategory) return;
        
        var fullUrl = href.indexOf("http") === 0 ? href : BASE_URL + href;
        if (seen[fullUrl]) return;
        seen[fullUrl] = true;
        
        genres.push({
            title: title,
            input: fullUrl,
            script: "gen.js"
        });
    });
    
    var author = "";
    var narratorEl = doc.select(".cti_comic a[href*='/giong-doc/']").first();
    if (narratorEl) author = cleanText(narratorEl.text());
    
    var audioList = parseAudioList(html);
    var episodesCount = audioList.length;
    
    var ongoing = true;
    var checkContent = (nameText + " " + description + " " + (audioList.length > 0 ? audioList[audioList.length - 1].title : "")).toLowerCase();
    if (checkContent.indexOf("full") >= 0 || checkContent.indexOf("hoàn thành") >= 0 || checkContent.indexOf("trọn bộ") >= 0 || checkContent.indexOf("tập cuối") >= 0) {
        ongoing = false;
    }
    
    return Response.success({
        name: nameText,
        cover: cover,
        author: author || "Kênh Truyện Ma",
        description: description,
        detail: "Số tập: " + episodesCount + (author ? "<br>Giọng đọc: " + author : ""),
        ongoing: ongoing,
        genres: genres,
        format: "series",
        host: BASE_URL
    });
}
