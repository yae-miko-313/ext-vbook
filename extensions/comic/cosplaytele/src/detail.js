load('config.js');

function execute(url) {
    if (!url) return Response.error("No url");

    // Normalize to path
    url = url.replace(BASE_URL, '');
    if (!url.startsWith('/')) url = '/' + url;
    url = url.replace(/\/$/, '');

    var response = fetch(BASE_URL + url, { method: 'GET' });
    if (response.ok) {
        var doc = response.html();

        var name = doc.select('h1.entry-title').text();
        if (!name) name = doc.select('title').text();

        var cover = '';
        var firstImg = doc.select('#gallery-1 .gallery-item img').first();
        if (!firstImg) firstImg = doc.select('.entry-content a img').first();
        if (firstImg) cover = firstImg.attr('src') || firstImg.attr('data-src') || firstImg.attr('data-original');

        var description = '';
        var p = doc.select('.entry-content p').first();
        if (p) description = p.text();

        return Response.success({
            name: name,
            cover: cover,
            author: 'Unknown',
            description: description,
            host: BASE_URL
        });
    }
    return Response.error("Failed to load detail");
}
