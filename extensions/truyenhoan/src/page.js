load('config.js');

function execute(url, page) {
    page = page || 1;
    
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    
    var pageUrl = url;
    if (page > 1) {
        pageUrl = url + "trang-" + page + "/";
    }
    
    var response = fetch(pageUrl);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var chapters = [];
    
    doc.select("a[href*='chuong']").forEach(function(a) {
        var chapterLink = a.attr("href") || "";
        var chapterTitle = a.text().trim();
        
        if (chapterLink.match(/chuong-\d+/) && chapterTitle.length > 0) {
            var match = chapterTitle.match(/chuong[^0-9]*(\d+)/i);
            var chapterNum = match ? parseInt(match[1]) : 0;
            
            chapters.push({
                title: chapterTitle,
                input: chapterLink,
                number: chapterNum
            });
        }
    });
    
    chapters.sort(function(a, b) { return a.number - b.number; });
    
    var pageCount = 1;
    var paginationText = doc.select(".pagination, .page-info, nav").text();
    if (paginationText && paginationText.length > 0) {
        var match = paginationText.match(/Last.*?trang-(\d+)|(?:Page\s+)?(\d+).*?(?:of|\/)\s*(\d+)/i);
        if (match && (match[1] || match[3])) {
            pageCount = Math.max(10, parseInt(match[1] || match[3]));
        }
    }
    
    return Response.success({
        chapters: chapters,
        pageInfo: {
            pageNumber: page,
            pageCount: pageCount,
            pageSize: chapters.length
        }
    });
}
