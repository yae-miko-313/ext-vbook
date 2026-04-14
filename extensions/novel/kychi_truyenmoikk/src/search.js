load('config.js');
function execute(key, page) {
    if (!page) page = '1';
    var response = fetchPage(BASE_URL + '/tim-kiem/?tu-khoa=' + key + '&trang=' + page);
    if (response.ok) {
        var doc = response.html();
        var data = [];
        var items = doc.select('.list-truyen .row');
        items.forEach(function(e) {
            data.push({
                name: e.select('.truyen-title a').text(),
                link: e.select('.truyen-title a').attr('href'),
                cover: e.select('img').attr('src'),
                description: e.select('.author').text(),
                host: BASE_URL
            });
        });
        var next = doc.select('.pagination .active + li a').text();
        return Response.success(data, next);
    }
    return Response.error('HTTP Error: ' + response.status);
}