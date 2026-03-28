load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var chapters = [];
    
    doc.select("a[href*='chuong']").forEach(function(a) {
        var chapterLink = a.attr("href") || "";
        var chapterTitle = a.text().trim();
        
        if (chapterLink.match(/chuong-\d+/i) && chapterTitle.length > 0) {
            var match = chapterTitle.match(/chuong[^0-9]*(\d+)/i) || chapterLink.match(/chuong-(\d+)/i);
            var chapterNum = match ? parseInt(match[1]) : 0;
            chapters.push({
                name: chapterTitle,
                url: chapterLink,
                host: BASE_URL,
                number: chapterNum
            });
        }
    });
    
    if (chapters.length === 0) return Response.error("Không tìm thấy chương");
    
    chapters.sort(function(a, b) { return a.number - b.number; });
    
    var finalChapters = [];
    for (var i = 0; i < chapters.length; i++) {
        finalChapters.push({
            name: chapters[i].name,
            url: chapters[i].url,
            host: chapters[i].host
        });
    }
    
    return Response.success(finalChapters);
}
