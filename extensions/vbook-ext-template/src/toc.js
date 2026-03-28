load('config.js');

function execute(url) {
    var target = url;
    if (target.indexOf('http') !== 0) {
        target = BASE_URL + target;
    }

    var response = fetch(target);
    if (!response.ok) {
        return Response.error('TOC failed: ' + response.status);
    }

    var doc = response.html();
    var chapters = [];

    // TODO: update selectors for your target site.
    doc.select('.chapter-item a').forEach(function (el) {
        chapters.push({
            name: el.text(),
            url: el.attr('href'),
            host: BASE_URL
        });
    });

    return Response.success(chapters);
}
