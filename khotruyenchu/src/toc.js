load('config.js');

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let chapters = [];
        
        let items = doc.select(".list-chuong a, .entry-content a[href*='/chuong-']");
        if (items.isEmpty()) {
            // Fallback for some WP themes
            items = doc.select("article a[href*='/chuong-']");
        }

        let seenUrls = {};
        for (let i = 0; i < items.size(); i++) {
            let item = items.get(i);
            let name = item.text().trim();
            let href = item.attr("href");
            if (name && href && (href.indexOf('/chuong-') > 0 || href.indexOf('/chuong/') > 0) && href.indexOf('#') === -1) {
                // Normalize URL
                let cleanUrl = href.split('?')[0].split('#')[0];
                if (cleanUrl.endsWith('/')) cleanUrl = cleanUrl.slice(0, -1);
                
                if (!seenUrls[cleanUrl]) {
                    seenUrls[cleanUrl] = true;
                    
                    // Beautify name: "Chương 1: Tên" or "Chương 1 - Tên" -> "Chương 1: Tên"
                    let cleanName = name.replace(/\s+/g, ' ')
                        .replace(/^(Chương\s+\d+)\s*[:\-\s]\s*/i, "$1: ")
                        .trim();
                    
                    chapters.push({
                        name: cleanName,
                        url: cleanUrl + "/",
                        host: BASE_URL
                    });
                }
            }
        }
        return Response.success(chapters);
    }
    return null;
}
