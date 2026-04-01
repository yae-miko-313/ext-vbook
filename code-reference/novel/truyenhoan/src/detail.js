load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';

    var response = fetch(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);
    var doc = response.html();

    var name = doc.select('div.col-info-desc h1.title[itemprop=name]').text().trim();
    if (!name) {
        name = doc.select('div.col-info-desc h1.title').text().trim();
    }

    var cover = doc.select('div.info-holder img[itemprop=image]').attr('src') || '';
    if (cover.indexOf('//') === 0) cover = 'https:' + cover;

    var author = doc.select('div.info a[itemprop=author]').first();
    var authorText = author ? author.text().trim() : '';

    var statusText = '';
    doc.select('.info > div').forEach(function(div) {
        var h3 = div.select('h3');
        if (h3.size() > 0 && h3.text().indexOf('Trạng thái') >= 0) {
            var sp = div.select('span').first();
            if (sp) statusText = sp.text().trim();
        }
    });
    if (!statusText) {
        var spStatus = doc.select('.info span.text-success').first();
        if (spStatus) statusText = spStatus.text().trim();
    }

    var stLower = statusText.toLowerCase();
    var ongoing = true;
    if (
        stLower.indexOf('full') >= 0 ||
        stLower.indexOf('hoàn') >= 0 ||
        stLower.indexOf('đã hoàn') >= 0 ||
        stLower.indexOf('complete') >= 0
    ) {
        ongoing = false;
    }

    var descEl = doc.select('div.desc-text.desc-text-full[itemprop=description]').first();
    if (!descEl) {
        descEl = doc.select('div.desc-text[itemprop=description]').first();
    }
    var descriptionHtml = descEl ? descEl.html() : '';
    if (descriptionHtml) {
        descriptionHtml =
            descriptionHtml.trim() +
            '<div style="height:32px" aria-hidden="true"></div>';
    }

    var detail =
        '<p><strong>Tên truyện:</strong> ' +
        name +
        '</p>' +
        '<p><strong>Tác giả:</strong> ' +
        authorText +
        '</p>' +
        '<p><strong>Trạng thái:</strong> ' +
        statusText +
        '</p>';

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: authorText,
        description: descriptionHtml,
        detail: detail,
        ongoing: ongoing,
        genres: [],
        suggests: []
    });
}
