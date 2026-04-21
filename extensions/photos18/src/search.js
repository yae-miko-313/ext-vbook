load('config.js');
function execute(key, page) {
    if (!page) page = "1";
    let url = BASE_URL + '/q/' + key + '?category_id=&page=' + page
    let response = fetch(url, { method: "GET" })
    if (response.ok) {
        let doc = response.html();
        let data = [];
        doc.select(".card-columns > .card").forEach(e => {
            data.push({
                name: e.select(".card-body a").text(),
                link: e.select(".card-body a").attr('href'),
                cover: BASE_URL + e.select("a.visited img").attr("src"),
                host: BASE_URL,
            })
        });
        var next = doc.select(".pagination .next a").first().attr("href").match(/page=(\d+)/)
        if (next) next = next[1]; else next = '';
        return Response.success(data, next)
    }
    return null;
}
