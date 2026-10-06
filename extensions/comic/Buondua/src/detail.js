load('config.js');
function execute(url) {
    url = decodeURIComponent(url)
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let genres = [];
        doc.select(".article-tags").first().select("a").forEach((tag) => {
            var title = tag.select("span").text();
            
            genres.push({
                title: title,
                input:  BASE_URL +  encodeURIComponent(tag.attr("href")).replace("%2F","/"),
                script: "gen.js"
            })
        })
        let name = doc.select(".article-header h1").text();
        return Response.success({
            name: name,
            cover: doc.select("div.article-fulltext > p > img").first().attr("src"),
            author: 'Không có tác giả',
            description: "Người tà dâm luôn có quỷ theo sau 😈",
            detail: "书名：" + name + "<br>作者：未知",
            host: BASE_URL,
            genres: genres
        });
    }
    return null;
}