load('config.js');
function execute(url, page) {
    if (!page) page = '1';
    var fetchUrl = url.replace(/\/$/, '') + '/trang-' + page + '/';
    var response = fetchPage(fetchUrl);
    if (response.ok) {
        var doc = response.html();
        var data = [];
        var items = doc.select('.list-truyen .row[itemscope]');
        for (var i = 0; i < items.size(); i++) {
            var e = items.get(i);
            var rawLink = e.select('h3.truyen-title a').attr('href') || '';
            var parts = rawLink.split('/').filter(function(x) { return x; });
            var slug = parts.length ? parts[parts.length - 1] : '';
            data.push({
                name: e.select('h3.truyen-title a').text(),
                link: slug ? (BASE_URL + '/' + slug) : rawLink,
                cover: e.select('.col-xs-3 img').attr('src'),
                description: e.select('.author').text().trim(),
                host: BASE_URL
            });
        }
        var next = doc.select('.pagination li.active + li a').text();
        return Response.success(data, next);
    }
    return Response.error('HTTP Error: ' + response.status);
}