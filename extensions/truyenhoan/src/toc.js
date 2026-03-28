load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var chapters = [];
    
    doc.select(".list-chapter li a, #chapter-list li a, .chapter-list li a").forEach(function(a) {
        var chapterLink = a.attr("href") || "";
        var chapterTitle = a.text().trim();
        
        if (chapterLink && chapterTitle.length > 0) {
            chapters.push({
                name: chapterTitle,
                url: chapterLink,
                host: BASE_URL
            });
        }
    });
    
    return Response.success(chapters);
}
