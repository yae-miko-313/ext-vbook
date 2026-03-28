load('config.js');

function execute(input, page) {
    page = page || 1;
    
    var categoryMap = {
        "truyen-hot": "/truyen-hot/",
        "truyen-moi-cap-nhat": "/truyen-moi-cap-nhat/",
        "truyen-full": "/truyen-full/",
        "truyen-moi-dang": "/truyen-moi-dang/"
    };
    
    var pathSuffix = categoryMap[input] || "/" + input + "/";
    var url = BASE_URL + pathSuffix;
    if (page > 1) {
        url = BASE_URL + pathSuffix + "trang-" + page + "/";
    }
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var novels = [];
    
    doc.select(".novel-item, .truyen-item, [class*='novel'], [class*='truyen']").forEach(function(e) {
        var titleEl = e.select("h3 a, h2 a, .truyen-title a, .novel-title a, .novel-name").first();
        if (!titleEl || !titleEl.text()) {
            titleEl = e.select("a").first();
        }
        
        if (!titleEl || !titleEl.text()) return;
        
        var title = titleEl.text().trim();
        var link = titleEl.attr("href") || "";
        var cover = e.select("img").attr("src") || "";
        
        if (title && link && title.length > 2 && title.length < 200) {
            novels.push({
                title: title,
                input: link,
                cover: cover
            });
        }
    });
    
    if (novels.length === 0) {
        doc.select("a[href*='\\.'][href*='/']").forEach(function(a) {
            var title = a.text().trim();
            var link = a.attr("href") || "";
            if (link.match(/\.\d+\/?$/) && title.length > 2 && title.length < 200) {
                novels.push({
                    title: title,
                    input: link,
                    cover: ""
                });
            }
        });
    }
    
    var pageInfo = { pageNumber: page, pageCount: 10, pageSize: 30 };
    var paginationText = doc.select(".pagination, .page-info, nav[aria-label='pagination']").text();
    if (paginationText) {
        var match = paginationText.match(/(?:trang\s)?(\d+).*?(?:của|\/)\s*(\d+)|Last.*?»|trang-(\d+)/i);
        if (match && match[2]) {
            pageInfo.pageCount = parseInt(match[2]);
        }
    }
    
    return Response.success({
        novels: novels.slice(0, 30),
        pageInfo: pageInfo
    });
}
