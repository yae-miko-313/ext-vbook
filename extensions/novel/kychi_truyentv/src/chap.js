load('config.js');
function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) {
        return Response.error('Không tải được nội dung chương');
    }
    
    var doc = response.html();
    var content = "";
    
    var selectors = ['#chapter-content', '.chapter-content', '#chapter-c', '.chapter-c', '.chapter-con', '#content'];
    for (var i = 0; i < selectors.length; i++) {
        var el = doc.select(selectors[i]).first();
        if (el) {
            // Clean up unneeded noise elements
            el.select('.quang-cao, script, style, .ads, .signature, .adsbygoogle, .quang-cao-holder').remove();
            var html = el.html();
            if (html && html.trim().length > 0) {
                content = html;
                break;
            }
        }
    }
    
    if (content) {
        return Response.success(cleanHtml(content));
    }
    
    return Response.error('Không tìm thấy nội dung chương');
}
