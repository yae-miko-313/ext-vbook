load('config.js');

function pickText(el) {
    return el ? el.text().trim() : '';
}

function pickAttr(el, key) {
    return el ? (el.attr(key) || '') : '';
}

function execute(url) {
    var response = fetch(url);
    if (response.ok){
        var doc = response.html();
        var titleEl = doc.select('h1.title, h1[itemprop=name]').first();
        var coverEl = doc.select('.book img, .info-holder img[itemprop=image], img[itemprop=image]').first();
        var authorEl = doc.select('.info > div').first() || doc.select('a[itemprop=author]').first();
        var statusEl = doc.select('.info .label, .info span.text-success').first();

        var name = pickText(titleEl);
        var cover = pickAttr(coverEl, 'src');
        var author = pickText(authorEl);
        var description = doc.select('.desc-text, [itemprop=description]').first();
        var descriptionHtml = description ? description.html() : '';
        var statusText = pickText(statusEl);

        if (cover.indexOf('//') === 0) {
            cover = 'https:' + cover;
        }

        var ongoing = true;
        var st = statusText.toLowerCase();
        if (st.indexOf('full') >= 0 || st.indexOf('hoàn') >= 0 || st.indexOf('đã hoàn') >= 0 || st.indexOf('complete') >= 0) {
            ongoing = false;
        }

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: descriptionHtml,
            detail: author + '<br>Trạng thái: ' + statusText,
            ongoing: ongoing,
            genres: [],
            suggests: [],
            host: BASE_URL
        });
    }
    return Response.error('HTTP Error: ' + response.status);
}