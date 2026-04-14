load('config.js');
function execute(url) {
    var doc = loadDocument(url, 15000);
    if (!doc) return Response.error('HTTP Error: Unable to load page');

    var name = doc.select('meta[property="og:title"]').attr('content');
    if (!name) name = doc.select('h1').text().trim();
    if (!name) name = doc.select('.story-title').text().trim();
    name = cleanTitle(name);

    var cover = doc.select('meta[property="og:image"]').attr('content');
    if (!cover) cover = doc.select('.p-3 img').first().attr('src');
    if (!cover) cover = doc.select('img[alt]').first().attr('src');

    var author = doc.select('a[href*="/thanh-vien/"]').first().text().trim();
    if (!author) author = doc.select('.p-3 .border .p-2 p a').text().trim();
    if (!author) author = doc.select('[itemprop="author"]').text().trim();

    var description = doc.select('meta[property="og:description"]').attr('content');
    if (!description) description = doc.select('.p-3 .inline-block  p').html();
    if (!description) description = doc.select('.prose').html();

    var statusText = normalizeStatus(extractStatusText(doc));
    var ongoing = statusText !== 'Hoàn thành';

    var detail = doc.select('.p-3 .border .p-2 p a').text();
    if (!detail) detail = '';
    if (author && detail.indexOf(author) < 0) {
        detail = '<p><strong>Tác giả:</strong> ' + author + '</p>' + (detail ? '<br>' + detail : '');
    }
    if (statusText && detail.indexOf('Trạng thái') < 0) {
        detail += (detail ? '<br>' : '') + '<p><strong>Trạng thái:</strong> ' + statusText + '</p>';
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detail,
        category: doc.select('.p-3 .border .p-2.leading-7 p a').html(),
        ongoing: ongoing,
        host: BASE_URL
    });
}

function cleanTitle(title) {
    if (!title) return '';
    return String(title).replace(/^Truyện:\s*/i, '').trim();
}

function extractStatusText(doc) {
    var text = '';
    doc.select('p, span, li').forEach(function(el) {
        if (text) return;
        var value = el.text().trim();
        if (!value) return;
        var lower = value.toLowerCase();
        if (lower.indexOf('hoàn thành') >= 0 || lower.indexOf('đã hoàn') >= 0 || lower.indexOf('đang ra') >= 0 || lower.indexOf('full') >= 0) {
            text = value;
        }
    });
    return text;
}
