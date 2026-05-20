load('config.js');


function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var rawHtml = response.text();
    var map = extractBeforeContentMap(rawHtml);
    var doc = response.html();

    var contentEl = doc.select('#chapter-content-render').first();
    if (!contentEl) contentEl = doc.select('.chapter-content .content-container').first();
    if (!contentEl) contentEl = doc.select('.chapter-content').first();
    if (!contentEl) return Response.error('Không tìm thấy nội dung chương');

    contentEl.select('script, iframe, style, .ads, .adsbygoogle, .quang-cao, .chapter-nav, .chapter-tools, .comments, .chapter-comment, .my-4').remove();
    contentEl.select('.signature, p.signature').remove();
    contentEl.select('.affClick').remove();
    var affActive = contentEl.select('.affActive');
    if (affActive.size() > 0) {
        affActive.attr('style', '');
    }
    contentEl.select('[style*="display:none"], [style*="display: none"], [style*="font-size:0"], [style*="font-size: 0"], [hidden]').remove();

    var content = contentEl.html();
    content = decodeObfuscatedSpan(content, map);
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');
    content = content.replace(/<\/?(?:html|head|body)[^>]*>/gi, '');
    content = content.replace(/[\u200B-\u200D\uFEFF]/g, '');
    content = content.replace(/<p>\s*(?:&nbsp;|\u00a0|<br\s*\/?>)*\s*<\/p>/gi, '<br>');
    content = content.replace(/(<br\s*\/?>\s*){3,}/g, '<br><br>');

    return Response.success(content);
}