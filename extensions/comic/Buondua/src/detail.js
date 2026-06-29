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
        return Response.success({
            name: doc.select(".article-header h1").text(),
            cover: doc.select("div.article-fulltext > p > img").first().attr("src"),
            author: 'Không có tác giả',
            description: "Người tà dâm luôn có quỷ theo sau 😈",
            host: BASE_URL,
            genres: genres
        });
    }
    return null;
}