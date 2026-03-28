load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    
    var chapters = [];
    var currentPage = 1;
    var totalPages = 76;
    
    var pageUrl = url;
    var fetchAttempts = 0;
    var maxAttempts = Math.min(totalPages, 10);
    
    while (currentPage <= totalPages && fetchAttempts < maxAttempts) {
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
            
            if (chapterLink.match(/chuong-\d+/) && chapterTitle.length > 0) {
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
        
        var paginationText = doc.select(".pagination, .page-info, nav").text();
        if (paginationText.indexOf("Last") >= 0 || paginationText.indexOf("Last »") >= 0) {
            var match = paginationText.match(/trang-(\d+)/);
            if (match) totalPages = parseInt(match[1]);
            fetchAttempts = maxAttempts;
        }
        
        currentPage++;
        fetchAttempts++;
    }
    
    chapters.sort(function(a, b) { return a.number - b.number; });
    
    return Response.success(chapters);
}
