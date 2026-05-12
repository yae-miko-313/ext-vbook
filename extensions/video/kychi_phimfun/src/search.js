load('config.js');

function execute(key, page) {
    if (!page) page = '1';

    var url = BASE_URL + "/search?k=" + encodeURIComponent(key);
    if (page !== '1') {
        url += "&page=" + page;
    }

    var response = fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (response.ok) {
        var doc = response.html();
        var list = parseCards(doc);
        var next = getNextPage(doc, page);

        return Response.success(list, next);
    }

    return null;
}
