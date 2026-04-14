load('config.js');
function execute(key, page) {
    if (!page) page = '1';
    var response = fetchPage(BASE_URL + '/search?keyword=' + key, {
        method: 'GET',
        queries: {
            page: page
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var comiclist = [];
    var next = doc.select('.my-5 nav a').last().attr('href').match(/\d+$/);
    if (next != null) {
        next = next[0];
    }
    doc.select('.container .mb-3 .mx-auto .flex').forEach(function(e) {
        comiclist.push({
            name: e.select('a').first().text(),
            link: e.select('a').attr('href'),
            cover: e.select('img').attr('src') || e.select('img').attr('src'),
            description: e.select('p a').first().text(),
            host: BASE_URL
        });
    });
    return Response.success(comiclist, next);
}
