load('config.js');

function execute(url) {
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';
    
    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();
    
    var pageCount = 1;
    var paginationText = doc.select(".pagination, .page-info, nav").text();
    if (paginationText && paginationText.length > 0) {
        var match = paginationText.match(/Last.*?trang-(\d+)|(?:Page\s+)?(\d+).*?(?:of|\/)\s*(\d+)/i);
        if (match && (match[1] || match[3])) {
            pageCount = parseInt(match[1] || match[3]);
        }
    }
    
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
