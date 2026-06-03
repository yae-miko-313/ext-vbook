load('config.js');

function execute(url) {
    var response = fetch(url);
    if (!response.ok) return Response.error("Cannot load detail: " + response.status);

    var doc = response.html();
    var book = doc.select(".main_box .content_box .left_box");
    var detail = "";
    book.select(".info_box div").forEach(function(e) {
        detail += e.text() + "<br>";
    });

    var novelId = getNovelId(url);
    var comments = [];
    if (novelId) {
        comments.push({
            title: "评论",
            input: BASE_URL + "/api/novel/app/novel/comments?novelId=" + novelId + "&sortType=1&page={{page}}&rows=10",
            script: "comment.js"
        });
    }

    return Response.success({
        name: book.select(".info_box h1").text(),
        cover: book.select(".cover").attr('src'),
        author: book.select(".info_box div").get(2).text().replace("作者：", ""),
        description: book.select(".brief").text().replace(/\r?\n/g, "<br>"),
        detail: detail,
        host: BASE_URL,
        comments: comments
    });
}

function getNovelId(url) {
    var m = (url || "").match(/[?&]id=(\d+)/);
    return m && m[1] ? m[1] : "";
}
