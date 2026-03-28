load('config.js');

function execute(url) {
    var target = url;
    if (target.indexOf('http') !== 0) {
        target = BASE_URL + target;
    }

    var response = fetch(target);
    if (!response.ok) {
        return Response.error('Detail failed: ' + response.status);
    }

    var doc = response.html();

    // TODO: update selectors for your target site.
    var name = doc.select('h1').first() ? doc.select('h1').first().text() : '';
    var cover = doc.select('img.cover').attr('src');
    var author = doc.select('.author').text();
    var description = doc.select('.description').text();

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: 'Author: ' + author,
        ongoing: true,
        genres: [],
        suggests: []
    });
}
