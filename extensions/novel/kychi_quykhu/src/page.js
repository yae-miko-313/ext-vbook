load('config.js');

function execute(url) {
    var response = fetch(url, {
        headers: {
            'User-Agent': BASE_UA
        }
    });

    if (!response.ok) {
        return Response.error('HTTP Error: ' + response.status);
    }

    var doc = response.html();
    var matched = doc.toString().match(/"numberOfPages"\s*:\s*(\d+)/);
    var chapterCount = matched ? parseInt(matched[1], 10) : 0;
    if (chapterCount <= 0) {
        return Response.success([url]);
    }

    var pages = [];
    var totalPage = Math.ceil(chapterCount / 50);
    for (var i = 1; i <= totalPage; i++) {
        pages.push(url + '?pagechap=' + i);
    }

    return Response.success(pages);
}
