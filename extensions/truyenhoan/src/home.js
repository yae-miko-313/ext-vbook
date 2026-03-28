load('config.js');

function execute(category) {
    category = category || "truyen-hot";
    
    var url = BASE_URL + "/" + (category === "truyen-hot" ? category + "/" : category.replace(/truyen-/, "truyen-") + "/");
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var novels = [];
    doc.select(".novel-item, .truyen-item, .list-truyen li[data-id], .list-truyen li a").forEach(function(e) {
        var titleEl = e.select("h3 a, h2 a, .truyen-title a, .novel-title").first();
        if (!titleEl || !titleEl.text()) return;
        
        var title = titleEl.text().trim();
        var link = titleEl.attr("href") || "";
        var cover = e.select("img").attr("src") || "";
        var author = e.select(".author, .tac-gia, .by-author").text().trim();
        
        var chapterEl = e.select(".last-chapter, .newest, .chapter-info").first();
        var latestChapter = chapterEl ? chapterEl.text().trim() : "";
        
        var statusEl = e.select(".status, .trang-thai, .badge").first();
        var status = statusEl ? statusEl.text().trim() : "";
        
        if (title && link) {
            novels.push({
                title: title,
                input: link,
                cover: cover,
                author: author,
                latest: latestChapter,
                status: status
            });
        }
    });
    
    if (novels.length === 0) {
        var sections = doc.select("h2, h3");
        sections.forEach(function(h) {
            if (h.text().indexOf("TRUYỆN") >= 0 || h.text().indexOf("truyện") >= 0) {
                var parent = h.parent();
                parent.select("a").forEach(function(a) {
                    var title = a.text().trim();
                    var link = a.attr("href") || "";
                    if (title && link && title.length > 2) {
                        novels.push({
                            title: title,
                            input: link,
                            cover: "",
                            author: "",
                            latest: "",
                            status: ""
                        });
                    }
                });
            }
        });
    }
    
    if (novels.length === 0) {
        doc.select("a[href*='/']").forEach(function(a) {
            var title = a.text().trim();
            var link = a.attr("href") || "";
            if (link.match(/\.\d+\/$/) && title.length > 2 && title.length < 150) {
                var exists = false;
                for (var i = 0; i < novels.length; i++) {
                    if (novels[i].title === title) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    novels.push({
                        title: title,
                        input: link,
                        cover: "",
                        author: "",
                        latest: "",
                        status: ""
                    });
                }
            }
        });
    }
    
    return Response.success(novels.slice(0, 30));
}
