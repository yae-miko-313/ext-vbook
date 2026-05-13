load('config.js');

function execute(url, page) {
    if (!page) page = '1';
    
    var requestUrl = url;
    if (url.indexOf('?') === -1) {
        requestUrl = url + '?page=' + page;
    } else {
        requestUrl = url + '&page=' + page;
    }

    var response = fetch(requestUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();
        var list = parseCards(doc);
        
        var next = null;
        if (list.length > 0) {
            var nextBtn = doc.select("a[rel='next'], .pagination .next");
            if (nextBtn.length > 0) {
                next = (parseInt(page) + 1).toString();
            }
        }

        return Response.success(list, next);
    }

    return Response.error("Không thể tải trang");
}
