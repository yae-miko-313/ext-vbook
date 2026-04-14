load('config.js');

function execute(url) {
    url = normalizeTocUrl(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error('HTTP Error: ' + response.status);

    var doc = response.html();
    var pageCount = 1;
    doc.select('ul.pagination a').forEach(function(a) {
        var link = a.attr('href') || '';
        var match = link.match(/trang-(\d+)/i);
        if (match) {
            var num = parseInt(match[1], 10);
            if (num > pageCount) pageCount = num;
        }
    });

    var pages = [];
    for (var i = 1; i <= pageCount; i++) {
        if (i === 1) {
            pages.push(url);
        } else {
            pages.push(url + 'trang-' + i + '/');
        }
    }

    return Response.success(pages);
}

function normalizeTocUrl(u) {
    u = String(u || '').replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (u.indexOf('//') === 0) u = 'https:' + u;
    u = u.replace(/\/trang-\d+\/?(?:#.*)?$/, '/');
    u = u.replace(/#.*$/, '');
    if (u.charAt(u.length - 1) !== '/') u = u + '/';
    return u;
}