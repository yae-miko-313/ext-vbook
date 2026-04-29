load('config.js');
function execute(key, page) {
    if (!page) page = '1';
    var encodedKey = encodeURIComponent(key).replace(/%20/g, '+');
    var searchUrl;
    if (page === '1') {
        searchUrl = BASE_URL + '/tim-kiem?tukhoa=' + encodedKey;
    } else {
        searchUrl = BASE_URL + '/tim-kiem/trang-' + page + '?tukhoa=' + encodedKey;
    }

    var response = fetchPage(searchUrl);
    if (response.ok) {
        var doc = response.html();
        var data = [];
        var items = doc.select('.list-truyen .row');
        items.forEach(function(e) {
            var a = e.select('.truyen-title a');
            if (a.size() > 0) {
                data.push({
                    name: a.text().trim(),
                    link: a.attr('href'),
                    cover: e.select('img').attr('src'),
                    description: e.select('.author').text().trim(),
                    host: BASE_URL
                });
            }
        });
        var next = doc.select('.pagination .active + li a').text().trim();
        return Response.success(data, next);
    }
    return Response.error('HTTP Error: ' + response.status);
}