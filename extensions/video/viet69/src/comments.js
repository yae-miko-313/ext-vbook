load('config.js');
function execute(input, page) {
    let url = input.indexOf("http") === 0 ? normalizeUrl(input) : BASE_URL + input;
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = [];
    doc.select("ul.comment-list > li.comment").forEach(function (el) {
        let replies = [];
        el.select("> ul.children > li.comment").forEach(function (r) {
            replies.push({
                name: r.select("cite.fn").first().text(),
                avatar: r.select("div.comment-avatar img").attr("src"),
                content: r.select("div.comment-content").first().text(),
                description: r.select("a.comment-time").first().text(),
                replies: []
            });
        });
        items.push({
            name: el.select("cite.fn").first().text(),
            avatar: el.select("div.comment-avatar img").attr("src"),
            content: el.select("div.comment-content").first().text(),
            description: el.select("a.comment-time").first().text(),
            replies: replies
        });
    });

    return Response.success(items, "");
}
