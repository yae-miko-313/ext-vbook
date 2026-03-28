load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var pageCount = 1;
    doc.select(".pagination a, nav a, .page-numbers").forEach(function(a) {
        var link = a.attr("href") || "";
        var match = link.match(/trang-(\d+)/i);
        if (match) {
            var num = parseInt(match[1]);
            if (num > pageCount) pageCount = num;
        }
    });
    
    var pages = [];
    for (var i = 1; i <= pageCount; i++) {
        var pageUrl = url;
        if (i > 1) {
            pageUrl = url + "trang-" + i + "/";
        }
        pages.push(pageUrl);
    }
    
    return Response.success(pages);
}
