load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    
    var fetchUrl = url + page;
    var doc = loadDocument(fetchUrl);
    if (!doc) return Response.success([]);
    
    var el = doc.select(".one-third-responsive .media");
    var novelList = [];
    
    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);
        
        // Robust cover parsing
        var coverImg = e.select(".media-left img.media-object").first();
        var cover = coverImg ? coverImg.attr("src") : "";
        cover = normalizeCoverUrl(cover);
        
        // Robust title and link parsing
        var heading = e.select("h4").first();
        var aTags = heading ? heading.select("a") : null;
        var titleLink = null;
        if (aTags) {
            for (var j = 0; j < aTags.size(); j++) {
                var a = aTags.get(j);
                var href = a.attr("href");
                if (href && href.indexOf("/truyen/") !== -1) {
                    titleLink = a;
                    break;
                }
            }
            if (!titleLink) {
                titleLink = aTags.first();
            }
        }
        
        var name = "";
        var link = "";
        if (titleLink) {
            link = normalizeUrl(titleLink.attr("href"));
            titleLink.select("span").remove(); // Strip prefix like TTV, KH inside the a tag
            name = cleanText(titleLink.text());
        }
        
        // Robust author and status parsing
        var authorEl = e.select("a[href*=/tac-gia/]").first();
        var author = authorEl ? cleanText(authorEl.text()) : "";
        var status = cleanText(e.select(".story-stage p").text());
        
        var description = "";
        if (author) description += author;
        if (status) description += (description ? " - " : "") + status;
        
        if (name && link) {
            novelList.push({
                name: name,
                link: link,
                description: description,
                cover: cover,
                author: author || "Đang cập nhật",
                host: BASE_URL
            });
        }
    }
    
    // Pagination calculation
    var next = null;
    var hasNext = doc.select(".pagination li.next").size() > 0;
    if (hasNext && novelList.length > 0) {
        next = String(Number(page) + 1);
    }
    
    return Response.success(novelList, next);
}
