load('config.js');
function execute(url) {
    let id = url.match(/(\d+)\.html/)[1];
    let response= fetch(BASE_URL + '/' + id + ".html");
    if (response.ok) {
        let doc = response.html();
        let genres = [];
        doc.select("span.single-tags a").forEach((tag) => {
            genres.push({
                title: tag.text(),
                input: tag.attr("href").replace(BASE_URL, ''),
                script: "gen.js"
            })
        });
        let name = doc.select(".item_title h1").text();
        return Response.success({
            name: name,
            cover: doc.select("div#image_div a img").first().attr("src"),
            author: 'Không có tác giả',
            description: "Người tà dâm luôn có quỷ theo sau 😈",
            detail: "书名：" + name + "<br>作者：未知",
            host: BASE_URL,
            genres: genres,
        });
    }
    return null;
}