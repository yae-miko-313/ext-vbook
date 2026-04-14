load('config.js');
function execute(url) {
    var response = fetchPage(url);
    if (response.ok) {
        var doc = response.html();
        var name = doc.select('meta[property="og:title"]').attr('content');
        if (!name) name = doc.select('h1.story-title').text().trim();
        if (!name) name = doc.select('header[itemtype="https://schema.org/Book"] h1[itemprop="name"]').text().trim();
        if (!name) name = doc.select('h3[itemprop="name"]').text().trim();
        var cover = doc.select('meta[property="og:image"]').attr('content');
        if (!cover) cover = doc.select('header[itemtype="https://schema.org/Book"] img.object-cover.rounded-xl').attr('src');
        if (!cover) cover = doc.select('img[itemprop="image"]').attr('src');
        if (!cover) cover = doc.select('.book img').attr('src');
        var author = doc.select('header[itemtype="https://schema.org/Book"] [itemprop="author"] [itemprop="name"]').text().trim();
        if (!author) author = doc.select('a[href*="/tac-gia/"]').first().text().trim();
        if (!author) author = doc.select('[itemprop="author"]').text().trim();
        if (!author) author = doc.select('.author').text().trim();
        var description = doc.select('article[itemprop="description"] [itemprop="description"]').html();
        if (!description) description = doc.select('[itemprop="description"]').html();
        if (!description) description = doc.select('.desc-text').html();
        var info = doc.select('.info').html();
        if (!info) info = doc.select('.cat-link').html();
        if (!info) info = '';
        var statusText = extractStatusText(doc.text());
        var ongoing = true;
        var lowerStatus = statusText.toLowerCase();
        if (lowerStatus.indexOf('hoàn thành') >= 0 || lowerStatus.indexOf('đã hoàn') >= 0 || lowerStatus.indexOf('full') >= 0) {
            ongoing = false;
            statusText = 'Hoàn thành';
        } else if (lowerStatus.indexOf('đang ra') >= 0 || lowerStatus.indexOf('đang tiến hành') >= 0) {
            statusText = 'Đang ra';
        }

        var detail = info;
        if (!detail) {
            detail = '<p><strong>Tác giả:</strong> ' + author + '</p>';
        }
        if (statusText && detail.indexOf('Trạng thái') < 0) {
            detail += '<br>Trạng thái: ' + statusText;
        }
        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: description,
            detail: detail,
            ongoing: ongoing,
            host: BASE_URL
        });
    }
    return Response.error('HTTP Error: ' + response.status);
}

function extractStatusText(text) {
    if (!text) return '';
    var cleaned = String(text).replace(/\s+/g, ' ').trim();
    var lower = cleaned.toLowerCase();
    if (lower.indexOf('hoàn thành') >= 0 || lower.indexOf('đã hoàn') >= 0 || lower.indexOf('full') >= 0) return 'Hoàn thành';
    if (lower.indexOf('đang ra') >= 0 || lower.indexOf('đang tiến hành') >= 0) return 'Đang ra';
    return '';
}