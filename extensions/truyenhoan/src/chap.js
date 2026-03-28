load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var contentEl = doc.select(".chapter-c, article, .chapter-content, .entry-content, .noi-dung, [class*='content']").first();
    var content = "";
    
    if (contentEl && contentEl.html()) {
        // Remove scripts or known ad elements if any
        contentEl.select("script, iframe, .ads, [style*='display:none']").remove();
        content = contentEl.html();
    } else {
        doc.select("p, div[class*='text']").forEach(function(p) {
            var text = p.html();
            if (text && text.length > 10) {
                content += text + "<br>";
            }
        });
    }
    
    if (!content || content.length < 50) {
        return Response.error("Không tìm thấy nội dung chương");
    }
    
    return Response.success(content);
}
