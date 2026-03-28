load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    
    if (!url.match(/chuong-\d+/)) {
        return Response.error("Invalid chapter URL");
    }
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var title = doc.select("h1, h2, .chapter-title, .truyen-title").text().trim();
    if (!title) {
        var titleEl = doc.select("title");
        if (titleEl) title = titleEl.text().split('|')[0].trim();
    }
    
    var contentEl = doc.select("article, .chapter-content, .entry-content, .noi-dung, [class*='content']").first();
    var content = "";
    
    if (contentEl && contentEl.html()) {
        content = contentEl.text().trim();
    } else {
        doc.select("p, div[class*='text'], div[class*='content']").forEach(function(p) {
            var text = p.text().trim();
            if (text && text.length > 10 && text.length < 5000) {
                content += (content ? "\n\n" : "") + text;
            }
        });
    }
    
    if (!content || content.length < 50) {
        var bodyText = doc.select("body").text();
        var lines = bodyText.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length > 100 && line.length < 10000) {
                content += (content ? "\n" : "") + line;
                if (content.length > 5000) break;
            }
        }
    }
    
    var chapterNum = 0;
    var match = title.match(/chuong[^0-9]*(\d+)/i) || url.match(/chuong-(\d+)/i);
    if (match) chapterNum = parseInt(match[1]);
    
    return Response.success({
        title: title,
        chapter: chapterNum,
        content: content.substring(0, 100000)
    });
}
