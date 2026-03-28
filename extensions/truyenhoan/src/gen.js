load('config.js');

function execute(input, page) {
    page = page || '1';
    
    var categoryMap = {
        "truyen-hot": "/truyen-hot/",
        "truyen-moi-cap-nhat": "/truyen-moi-cap-nhat/",
        "truyen-full": "/truyen-full/",
        "truyen-moi-dang": "/truyen-moi-dang/"
    };
    
    var pathSuffix = categoryMap[input] || input;
    if (pathSuffix.charAt(0) !== '/') pathSuffix = '/' + pathSuffix;
    if (pathSuffix.charAt(pathSuffix.length - 1) !== '/') pathSuffix = pathSuffix + '/';
    
    var url = BASE_URL + pathSuffix;
    if (page !== '1') {
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
                name: title,
                link: link,
                cover: cover,
                description: "",
                host: BASE_URL
            });
        }
    });
    
    if (novels.length === 0) {
        doc.select("a[href*='\\.'][href*='/']").forEach(function(a) {
            var title = a.text().trim();
            var link = a.attr("href") || "";
            if (link.match(/\.\d+\/?$/) && title.length > 2 && title.length < 200) {
                novels.push({
                    name: title,
                    link: link,
                    cover: "",
                    host: BASE_URL
                });
            }
        });
    }
    
    var nextPage = String(parseInt(page) + 1);
    return Response.success(novels, nextPage);
}
