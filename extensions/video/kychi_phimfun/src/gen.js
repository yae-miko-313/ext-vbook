load('config.js');

function execute(url, page) {
    if (!page) page = '1';

    // URL example: https://phimfun.net/the-loai/phim-moi-1
    // For page 2: https://phimfun.net/the-loai/phim-moi-2
    var requestUrl = url.replace(/-\d+$/, '-' + page);

    var response = fetch(requestUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();
        var list = parseCards(doc);
        
        // Find next page
        var next = null;
        var pagination = doc.select(".pagination li");
        if (pagination.length > 0) {
            var lastPage = pagination.last().text();
            if (lastPage === "»") {
                 // There is likely a next page if the last item is ">>"
                 next = (parseInt(page) + 1).toString();
            } else {
                var maxPage = parseInt(lastPage);
                if (!isNaN(maxPage) && parseInt(page) < maxPage) {
                    next = (parseInt(page) + 1).toString();
                }
            }
        }

        return Response.success(list, next);
    }

    return null;
}
