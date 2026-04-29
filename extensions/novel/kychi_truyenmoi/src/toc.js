load('config.js');

function execute(url) {
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var chapters = [];
    var items = doc.select('#list-chapter .list-chapter li a');
    if (items.size() === 0) {
        items = doc.select('.list-chapter li a');
    }

    items.forEach(function(e) {
        chapters.push({
            name: e.text().trim(),
            url: e.attr('href'),
            host: BASE_URL
        });
    });

    return Response.success(chapters);
}