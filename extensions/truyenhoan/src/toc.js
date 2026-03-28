load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    
    var chapters = [];
    var currentPage = 1;
    var maxPages = 20;
    var foundChapters = false;
    
    while (currentPage <= maxPages) {
        var pageUrl = url;
        if (currentPage > 1) {
            pageUrl = url + "trang-" + currentPage + "/";
        }
        
        var response = fetch(pageUrl);
        if (!response.ok) break;
        var doc = response.html();
        
        var pageChapters = [];
        doc.select("a[href*='chuong']").forEach(function(a) {
            var chapterLink = a.attr("href") || "";
            var chapterTitle = a.text().trim();
            
            if (chapterLink.match(/chuong-\d+/i) && chapterTitle.length > 0) {
                var match = chapterTitle.match(/chuong[^0-9]*(\d+)/i);
                var chapterNum = match ? parseInt(match[1]) : 0;
                
                pageChapters.push({
                    name: chapterTitle,
                    url: chapterLink,
                    number: chapterNum,
                    host: BASE_URL
                });
            }
        });
        
        if (pageChapters.length === 0) break;
        foundChapters = true;
        
        pageChapters.forEach(function(ch) {
            var exists = false;
            for (var i = 0; i < chapters.length; i++) {
                if (chapters[i].number === ch.number) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                chapters.push({
                    name: ch.name,
                    url: ch.url,
                    host: ch.host
                });
            }
        });
        
        currentPage++;
    }
    
    if (chapters.length === 0) {
        return Response.error("Không tìm thấy danh sách chương");
    }
    
    chapters.sort(function(a, b) { return a.number - b.number; });
    
    return Response.success(chapters);
}
