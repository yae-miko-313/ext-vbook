load('config.js');
function execute(query, page) {
    query = query || "";
    page = page || "1";

    let url;
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        url = listUrl(query, page);
    } else {
        url = (page === "1" ? BASE_URL + "/" : BASE_URL + "/page/" + page + "/") +
            "?s=" + encodeURIComponent(query);
    }

    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = [];
    doc.select("div.news-community").forEach(function (el) {
        let link = el.select("h2 a").first();
        if (!link) return;
        let count = el.select(".comm_count_meta a").text();
        items.push({
            name: link.text(),
            cover: el.select(".newsimage img").attr("src"),
            link: link.attr("href"),
            description: el.select(".rh_gr_right_desc p").text(),
            tag: (count || "0") + " bình luận"
        });
    });

    let next = items.length > 0 ? (parseInt(page, 10) + 1).toString() : "";
    return Response.success(items, next);
}
