load('config.js');

function execute(url) {
    var response = fetch(url, {
        headers: {
            'User-Agent': BASE_UA
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var contentEl = doc.select('.smiley, .chapter-content, article').first();
    if (!contentEl) {
        return Response.error('Không tìm thấy nội dung chương.');
    }

    var content = contentEl.html() || '';
    content = content
        .replace(/\n/gm, '<br>')
        .replace(/&(nbsp|amp|quot|lt|gt|bp|emsp);/g, ' ')
        .replace(/(<br\s*\/?>(\s|&nbsp;)*){2,}/g, '<br>')
        .replace(/<img[^>]*>/gi, '')
        .replace(/<\/?p[^>]*>/gi, '');

    if (!content.trim()) {
        return Response.error('Nội dung chương trống.');
    }

    return Response.success(content);
}
