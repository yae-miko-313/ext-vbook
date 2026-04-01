load('config.js');

function execute(url) {
    var target = url;
    if (target.indexOf('http') !== 0) {
        target = BASE_URL + target;
    }

    var response = fetch(target);
    if (!response.ok) {
        return Response.error('Chapter failed: ' + response.status);
    }

    var doc = response.html();
    var content = doc.select('.chapter-content').html();

    if (!content) {
        return Response.error('Empty chapter content');
    }

    return Response.success(content);
}
