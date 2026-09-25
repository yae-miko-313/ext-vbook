load('config.js');
// Gravatar urls come back protocol-relative ("//www.gravatar.com/..."); the app
// needs an absolute one.
function absAvatar(src) {
    return src.indexOf("//") === 0 ? "https:" + src : src;
}

function execute(input, page) {
    page = page || "1";
    if (page !== "1") return Response.success([], "");

    let url = normalizeUrl(input);
    let response = fetch(url);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let items = doc.select("ol.commentlist > li.comment").map(function (el) {
        return {
            name: el.select("> .commbox .fn").text(),
            avatar: absAvatar(el.select("> .commbox img.avatar").attr("src")),
            content: el.select("> .commbox > .comment-content").html(),
            description: el.select("> .commbox .time").text(),
            replies: el.select("> ul.children > li.comment").map(function (r) {
                return {
                    name: r.select("> .commbox .fn").text(),
                    avatar: absAvatar(r.select("> .commbox img.avatar").attr("src")),
                    content: r.select("> .commbox > .comment-content").html(),
                    description: r.select("> .commbox .time").text(),
                    replies: []
                };
            })
        };
    });

    return Response.success(items, "");
}
