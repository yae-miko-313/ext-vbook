function execute(url) {
    var chapUrl = url.split('?')[0].replace(/\/$/, "");
    if (chapUrl.indexOf("/chapters") === -1) chapUrl += "/chapters";
    var res = fetch(chapUrl);
    if (!res.ok) return null;
    var doc = res.html();
    var total = 1;
    doc.select("ul.pagination li a.page-link").forEach(function(e) {
        var m = e.attr("href").match(/page=(\d+)/);
        if (m && parseInt(m[1]) > total) total = parseInt(m[1]);
    });
    var list = [];
    for (var i = 1; i <= total; i++) list.push(chapUrl + "?page=" + i);
    return Response.success(list);
}