load('config.js');
function execute(url) {
    var response = fetch(url);
    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var contentEl = doc.select('div.chapter-content, .chapter-c, article, .entry-content, .noi-dung').first();
    if (!contentEl) {
        return Response.error('Không tìm thấy nội dung chương.');
    }

    contentEl.select('script, iframe, .ads, .advertisement, [style*=display:none]').remove();
    var content = contentEl.html() || '';
    content = content.replace(/<!--([\s\S]*?)-->/g, '');
    content = content.replace(/<(?:p|div)\b[^>]*>\s*<\/(?:p|div)>/g, '');
    content = content.replace(/&(nbsp|amp|quot|lt|gt|bp|emsp);/g, ' ');
    content = content.replace(/(<br\s*\/?>(\s|&nbsp;)*){2,}/g, '<br>');
    content = content.trim();

    if (!content) {
        return Response.error('Nội dung chương trống.');
    }

    return Response.success(content);
}