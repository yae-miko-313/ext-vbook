load('config.js');

function execute(input, page) {
    page = page || '1';
    
    var categoryMap = {
        "truyen-hot": "truyen-hot",
        "truyen-moi-cap-nhat": "truyen-moi-cap-nhat",
        "truyen-full": "truyen-full",
        "truyen-moi-dang": "truyen-moi-dang"
    };
    
    var pathSuffix = categoryMap[input] || input;
    var url = BASE_URL + "/" + pathSuffix + "/";
    if (page !== '1') {
        url = BASE_URL + "/" + pathSuffix + "/trang-" + page + "/";
    }
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var novels = [];
    
    // Try multiple selectors for story containers
    var storyElements = doc.select("div[class*='story'], div[class*='novel'], a[class*='story'], a[class*='novel'], li[class*='story'], li[class*='novel']");
    
    if (storyElements.size() === 0) {
        storyElements = doc.select(".item, .novel-item, .truyen-item, .story-item, .post-item");
    }
    
    storyElements.forEach(function(e) {
        var link = e.select("a").first();
        if (!link) link = e;
        
        var titleEl = link.select("h3, h2, h4, .truyen-title, .novel-title, .story-title, p").first();
        if (!titleEl || !titleEl.text()) {
            titleEl = link;
        }
        
        var title = titleEl.text().trim();
        var href = link.attr("href") || "";
        
        // Find cover image with multiple fallbacks
        var cover = e.select("img").first();
        var coverUrl = "";
        if (cover) {
            coverUrl = cover.attr("data-src") || cover.attr("data-original") || cover.attr("src") || "";
        }
        
        // Clean up title
        if (title.length > 200) title = title.substring(0, 200);
        
        // Extract description from multiple possible locations
        var desc = [];
        var author = e.select(".author, .tac-gia, [class*='author']").text().trim();
        if (!author) {
            author = e.select("a[href*='tac-gia']").text().trim();
        }
        if (author && author.length < 100) desc.push(author);
        
        var chapter = e.select(".chapter, .chuong, [class*='chapter'], .last-chapter").text().trim();
        if (chapter && chapter.length < 200) desc.push(chapter);
        
        var status = e.select(".status, .trang-thai, [class*='status']").text().trim();
        if (status && status.length < 50) desc.push(status);
        
        if (title && title.length > 2 && href && href.indexOf("/") >= 0) {
            novels.push({
                name: title,
                link: href,
                cover: coverUrl,
                description: desc.join(" - ") || "",
                host: BASE_URL
            });
        }
    });
    
    var nextPage = String(parseInt(page) + 1);
    return Response.success(novels, nextPage);
}
