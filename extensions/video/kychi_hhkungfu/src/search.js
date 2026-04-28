load('config.js');

// Input: ["keyword", page]
function execute(input) {
    var keyword = input[0] || "";
    var page = input[1] || 1;
    
    if (!keyword) return Response.success([]);
    
    var searchUrl = BASE_URL + "/?s=" + encodeURIComponent(keyword);
    
    // Fetch trực tiếp
    var response = fetch(searchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.7"
        }
    });
    
    if (!response.ok) return Response.success([]);
    
    var doc = response.html();
    if (!doc) return Response.success([]);
    
    var list = [];
    var seen = {};
    
    // Parse search results - same structure as home page
    var items = doc.select(".halim_box article .halim-item");
    if (items.size() === 0) {
        items = doc.select("article .halim-item");
    }
    if (items.size() === 0) {
        items = doc.select(".halim-item");
    }
    if (items.size() === 0) {
        items = doc.select(".halim_box article");
    }
    if (items.size() === 0) {
        items = doc.select("#wrapper article");
    }
    
    // Log debug
    try {
        Log.log("search.js: Found " + items.size() + " items");
    } catch (e) {}
    
    items.forEach(function(item) {
        var link = item.select("a.halim-thumb").first();
        if (!link) {
            link = item.select("a[href]").first();
        }
        if (!link) return;
        
        var href = link.attr("href") || "";
        if (!href || href.indexOf("/watch-") >= 0) return;
        if (href.indexOf("/category/") >= 0) return;
        if (seen[href]) return;
        
        var titleText = link.attr("title") || "";
        if (!titleText) {
            var h2 = item.select("h2.entry-title").first();
            titleText = h2 ? cleanText(h2.text()) : "";
        }
        if (!titleText) {
            titleText = cleanText(link.text());
        }
        if (!titleText || titleText.length < 2) return;
        
        seen[href] = true;
        
        var cover = "";
        var img = item.select("figure img").first();
        if (!img) {
            img = item.select("img").first();
        }
        if (img) {
            cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
        }
        
        var tag = "";
        var tagEl = item.select(".episode, .status").first();
        if (tagEl) {
            tag = cleanText(tagEl.text());
        }
        
        list.push({
            name: titleText,
            link: href.indexOf("http") === 0 ? href : BASE_URL + href,
            cover: cover,
            tag: tag,
            host: BASE_URL
        });
    });
    
    return Response.success(list);
}
