load('config.js');

function execute(url, page) {
    if (!page) page = '1';

    var fullUrl = BASE_URL + url;
    if (page !== '1') {
        fullUrl += '?page=' + page;
    }

    var response = fetch(fullUrl);
    if (!response.ok) return null;

    var doc = response.html();
    var data = [];

    var elements = doc.select(".post-feed-item");
    for (var i = 0; i < elements.size(); i++) {
        var e = elements.get(i);
        var a = e.select("h3 > a.link").first();
        if (a) {
            data.push({
                name: a.text(),
                link: BASE_URL + a.attr("href"),
                cover: e.select("img.avatar").first().attr("src"),
                description: e.select("div.post-meta--inline > div.post-meta.d-inline-flex.align-items-center.flex-wrap > div > span:nth-child(1)").first().text(),
                host: BASE_URL
            });
        }
    }

    // Tính trang kế tiếp đơn giản
    var next = (parseInt(page, 10) + 1).toString();

    return Response.success(data, next);
}
