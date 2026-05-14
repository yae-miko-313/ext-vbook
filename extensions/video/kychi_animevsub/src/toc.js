load('config.js');

function execute(url) {
    var response = fetchPage(url);
    if (!response.ok) return Response.success([]);

    var doc = response.html();
    var list = [];
    var items = doc.select('.episodes-grid a');

    items.forEach(function (a) {
        var name = cleanText(a.select('.episode-number').text()) || cleanText(a.text());
        if (name) {
            list.push({
                name: name,
                url: normalizeUrl(a.attr('href')),
                host: BASE_URL
            });
        }
    });

    return Response.success(list);
}
