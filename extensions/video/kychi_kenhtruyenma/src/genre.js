load('config.js');

// Genre: Fetch categories from website menu
function execute() {
    var response = fetch(BASE_URL, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": BASE_URL + "/"
        }
    });
    
    if (!response.ok) {
        // Fallback hardcoded
        return Response.success([
            { name: "Truyện mới đăng", title: "Truyện mới đăng", input: BASE_URL + "/truyen-moi-dang", script: "gen.js" },
            { name: "Truyện mới cập nhật", title: "Truyện mới cập nhật", input: BASE_URL + "/truyen-moi-cap-nhat", script: "gen.js" },
            { name: "Truyện Ma", title: "Truyện Ma", input: BASE_URL + "/truyen-ma", script: "gen.js" },
            { name: "Kiếm Hiệp", title: "Kiếm Hiệp", input: BASE_URL + "/kiem-hiep", script: "gen.js" },
            { name: "Ngôn Tình", title: "Ngôn Tình", input: BASE_URL + "/ngon-tinh", script: "gen.js" },
            { name: "Truyện Tiên Hiệp", title: "Truyện Tiên Hiệp", input: BASE_URL + "/truyen-tien-hiep", script: "gen.js" }
        ]);
    }
    
    var doc = response.html();
    if (!doc) return Response.success([]);
    
    var genres = [];
    var seen = {};
    
    // Parse from mega menu .menu-post-item
    doc.select(".menu-post-item h3.title a").forEach(function(a) {
        var title = cleanText(a.text());
        var href = a.attr("href") || "";
        if (!title || !href) return;
        
        // Skip tag links
        if (href.indexOf("/tag/") >= 0) return;
        
        var fullUrl = href.indexOf("http") === 0 ? href : BASE_URL + href;
        if (seen[fullUrl]) return;
        seen[fullUrl] = true;
        
        genres.push({
            name: title,
            title: title,
            input: fullUrl,
            script: "gen.js"
        });
    });
    
    if (genres.length === 0) {
        // Fallback
        genres = [
            { name: "Truyen moi dang", title: "Truyen moi dang", input: BASE_URL + "/truyen-moi-dang", script: "gen.js" },
            { name: "Truyen moi cap nhat", title: "Truyen moi cap nhat", input: BASE_URL + "/truyen-moi-cap-nhat", script: "gen.js" },
            { name: "Truyen Ma", title: "Truyen Ma", input: BASE_URL + "/truyen-ma", script: "gen.js" },
            { name: "Kiem Hiep", title: "Kiem Hiep", input: BASE_URL + "/kiem-hiep", script: "gen.js" },
            { name: "Ngon Tinh", title: "Ngon Tinh", input: BASE_URL + "/ngon-tinh", script: "gen.js" },
            { name: "Truyen Tien Hiep", title: "Truyen Tien Hiep", input: BASE_URL + "/truyen-tien-hiep", script: "gen.js" }
        ];
    }
    
    return Response.success(genres);
}
