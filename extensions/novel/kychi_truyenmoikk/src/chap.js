load('config.js');
function execute(url) {
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();
    var el = doc.select('.chapter-content');
    el.select('script, iframe, style, .ads, .quang-cao').remove();
    el.select('[style*="display:none"], [style*="display: none"], [style*="font-size:0"], [style*="font-size: 0"], [hidden]').remove();
    var content = el.html();
    content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
    content = content.replace(/(<br\s*\/?>\s*){3,}/g, '<br><br>');
    return Response.success(content);
}