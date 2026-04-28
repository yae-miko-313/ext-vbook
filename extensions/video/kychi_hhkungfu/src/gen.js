load('config.js');

function execute(url, page) {
    url = normalizeUrl(url);
    if (!page) page = '1';
    
    var pageInt = parseInt(page);
    if (pageInt > 1) {
        if (url.indexOf("/page/") > 0) {
            url = url.replace(/\/page\/\d+\/?$/, "/page/" + pageInt + "/");
        } else {
            url = url.replace(/\/?$/, "") + "/page/" + pageInt + "/";
        }
    }
    
    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.7"
        }
    });
    
    if (!response.ok) {
        return Response.success([], "");
    }
    
    var doc = response.html();
    
    if (!doc) {
        return Response.success([], "");
    }
    
    var list = [];
    var seen = {};
    
    // Thử nhiều selector khác nhau
    var items = doc.select(".halim_box article");
    if (items.size() === 0) {
        items = doc.select("article .halim-item");
    }
    if (items.size() === 0) {
        items = doc.select(".halim-item");
    }
    if (items.size() === 0) {
        items = doc.select("article.thumb");
    }
    
    // Log debug
    try {
        Log.log("gen.js: Found " + items.size() + " items for " + url);
    } catch (e) {}
    
    items.forEach(function(item) {
        // Tìm link chính - ưu tiên a.halim-thumb
        var link = item.select("a.halim-thumb").first();
        if (!link) {
            link = item.select("a[href]").first();
        }
        if (!link) return;
        
        var href = link.attr("href") || "";
        if (!href) return;
        // Chỉ lấy link phim (không phải watch, category, page)
        if (href.indexOf("/watch-") >= 0) return;
        if (href.indexOf("/category/") >= 0) return;
        if (href.indexOf("/page/") >= 0) return;
        if (seen[href]) return;
        
        // Lấy title từ a[title] hoặc h2.entry-title
        var titleText = link.attr("title") || "";
        if (!titleText) {
            var h2 = item.select("h2.entry-title").first();
            if (h2) titleText = cleanText(h2.text());
        }
        if (!titleText || titleText.length < 2) return;
        
        seen[href] = true;
        
        // Lấy cover từ img trong figure
        var cover = "";
        var img = item.select("figure img").first();
        if (!img) {
            img = item.select("img").first();
        }
        if (img) {
            cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
        }
        
        // Lấy episode tag
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
    
    // Find next page
    var nextPage = "";
    var nextLink = doc.select("a.next, .pagination a[href*='page/']").first();
    if (nextLink) {
        var nextHref = nextLink.attr("href") || "";
        var pageMatch = nextHref.match(/\/page\/(\d+)/);
        if (pageMatch) {
            nextPage = pageMatch[1];
        }
    }
    // Fallback cuối: Nếu vẫn không có items, thử tìm tất cả link a.halim-thumb
    if (list.length === 0) {
        try {
            Log.log("gen.js: Fallback - searching a.halim-thumb");
        } catch (e) {}
        
        doc.select("a.halim-thumb").forEach(function(a) {
            var href = a.attr("href") || "";
            if (!href) return;
            if (seen[href]) return;
            
            var titleText = a.attr("title") || "";
            if (!titleText || titleText.length < 2) return;
            
            seen[href] = true;
            
            // Lấy cover từ img trong figure
            var cover = "";
            var figure = a.select("figure img").first();
            if (figure) {
                cover = figure.attr("data-src") || figure.attr("src") || "";
            }
            
            // Lấy episode tag
            var tag = "";
            var parent = a.parent();
            if (parent) {
                var epEl = parent.select(".episode").first();
                if (epEl) tag = cleanText(epEl.text());
            }
            
            list.push({
                name: titleText,
                link: href.indexOf("http") === 0 ? href : BASE_URL + href,
                cover: cover,
                tag: tag,
                host: BASE_URL
            });
        });
    }
    
    if (!nextPage && list.length > 0) {
        nextPage = String(pageInt + 1);
    }
    
    return Response.success(list, nextPage);
}
