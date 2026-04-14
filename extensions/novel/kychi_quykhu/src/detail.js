load('config.js');
function execute(url) {
    var doc = loadDocument(url, 15000, 'h1, #content #ct-p, #chapter-list-title');
    if (!doc) return Response.error('HTTP Error: Unable to load page');

    var name = doc.select('meta[property="og:title"]').attr('content');
    if (!name) name = doc.select('h1').text().trim();
    if (!name) name = doc.select('.story-title').text().trim();
    name = cleanTitle(name);

    var cover = doc.select('meta[property="og:image"]').attr('content');
    if (!cover) cover = doc.select('.p-3 img').first().attr('src');
    if (!cover) cover = doc.select('img[alt]').first().attr('src');

    var author = extractMetaValue(doc, 'Tác giả');
    if (!author) author = doc.select('a[href*="/thanh-vien/"]').first().text().trim();
    if (!author) author = doc.select('[itemprop="author"]').text().trim();

    var description = doc.select('#content #ct-p').html();
    if (!description) description = doc.select('meta[property="og:description"]').attr('content');
    if (!description) description = doc.select('.p-3 .inline-block  p').html();
    if (!description) description = doc.select('.prose').html();

    var statusText = normalizeStatus(extractStatusText(doc));
    var ongoing = statusText !== 'Hoàn thành';

    var categoryText = extractCategories(doc);
    var updateText = extractMetaValue(doc, 'Cập nhật');
    var publishText = extractMetaValue(doc, 'Ngày đăng');
    var editorText = extractMetaValue(doc, 'Biên tập');

    var detailParts = [];
    if (author) detailParts.push('<p><strong>Tác giả:</strong> ' + author + '</p>');
    if (categoryText) detailParts.push('<p><strong>Thể loại:</strong> ' + categoryText + '</p>');
    if (statusText) detailParts.push('<p><strong>Trạng thái:</strong> ' + statusText + '</p>');
    if (updateText) detailParts.push('<p><strong>Cập nhật:</strong> ' + updateText + '</p>');
    if (publishText) detailParts.push('<p><strong>Ngày đăng:</strong> ' + publishText + '</p>');
    if (editorText) detailParts.push('<p><strong>Biên tập:</strong> ' + editorText + '</p>');
    var detail = detailParts.join('<br>');

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detail,
        category: categoryText,
        ongoing: ongoing,
        host: BASE_URL
    });
}

function cleanTitle(title) {
    if (!title) return '';
    return String(title).replace(/^Truyện:\s*/i, '').trim();
}

function extractStatusText(doc) {
    var text = normalizeStatus(extractMetaValue(doc, 'Trạng thái'));
    if (text) return text;
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

function extractMetaValue(doc, label) {
    var expected = String(label || '').toLowerCase();
    var result = '';
    doc.select('div.flex.items-center').forEach(function(row) {
        if (result) return;
        var labelEl = row.select('span.font-medium').first();
        if (!labelEl) return;
        var labelText = labelEl.text().trim().toLowerCase();
        if (labelText.indexOf(expected) !== 0) return;
        row.select('strong, a, span').forEach(function(node) {
            if (result) return;
            if (node === labelEl) return;
            var value = node.text().trim();
            if (!value || value === ':' || value.toLowerCase() === labelText) return;
            if (value.indexOf(':') === 0) value = value.substring(1).trim();
            if (value) result = value;
        });
    });
    return result;
}

function extractCategories(doc) {
    var categories = [];
    var seen = {};
    doc.select('a[href*="/the-loai/"]').forEach(function(a) {
        var text = a.text().trim();
        if (!text || seen[text]) return;
        seen[text] = true;
        categories.push(text);
    });
    return categories.join(', ');
}
