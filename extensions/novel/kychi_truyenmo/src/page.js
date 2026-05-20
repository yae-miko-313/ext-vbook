load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var pages = [];
    var seen = {};

    pages.push(url);
    seen[url] = true;

    doc.select('.pagination a[href]').forEach(function(a) {
        var href = normalizeUrl(a.attr('href'));
        if (!href || seen[href]) return;
        seen[href] = true;
        pages.push(href);
    });

    return Response.success(pages);
}