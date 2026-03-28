load('config.js');

function execute(key, page) {
    key = encodeURIComponent(key);
    let url = BASE_URL + "/tim-kiem?keyword=" + key;
    if (page) url += "&page=" + page;

    let response = fetch(url);
    if (!response.ok) return Response.error("Tìm kiếm thất bại");

    let doc = response.html();

    // Pagination
    let next = null;
    let nextHref = doc.select("a[aria-label='Go to next page']").attr("href");
    if (nextHref) {
        let match = nextHref.match(/page=(\d+)/);
        if (match) next = match[1];
    }

    // Parse results
    let el = doc.select("a[itemprop='hasPart']");
    let data = [];
    el.forEach(function(e) {
        data.push({
            name: e.select("p[itemprop='name']").text(),
            link: e.attr("href"),
            cover: e.select("img[itemprop='image']").attr("data-src") || e.select("img[itemprop='image']").attr("src"),
            description: [
                e.select("[itemprop='author'] [itemprop='name']").text(),
                e.select("[itemprop='bookFormat']").text(),
                e.select("[itemprop='dateModified']").text(),
                e.select("[itemprop='genre']").text()
            ].filter(function(t) { return t && t.length > 0; }).join(" - "),
            host: BASE_URL
        });
    });

    return Response.success(data, next);
}
