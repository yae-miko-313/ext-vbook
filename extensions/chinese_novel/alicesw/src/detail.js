load('config.js');
function execute(url) {
    let response = fetch(url, {
        headers: {
            "user-agent": MOBILE_UA
        }
    });
    if (response.ok) {
        let doc = response.html();
        var genres = [];
        var info = [];
        var author = "";
        doc.select(".detail-box .info .fix p.xs-show").forEach(e => {
            var text = e.text();
            if (text.indexOf("作者") === 0) {
                author = e.select("a").text();
                return;
            }
            if (text.indexOf("分类") === 0) {
                e.select("a").forEach(a => {
                    genres.push({
                        title: a.text(),
                        input: a.attr("href"),
                        script: "gen.js"
                    });
                });
            }
            info.push(e.html());
        });

        doc.select(".tags .tg a").forEach(e => {
            genres.push({
                title: e.text().replace("#", ""),
                input: BASE_URL + e.attr("href"),
                script: "suggest1.js"
            });
        });

        let name = doc.select(".detail-box h1").text().trim();
        let cover = doc.select(".detail-box .imgbox img").attr("src");
        if (cover.indexOf("/") === 0) cover = BASE_URL + cover;

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            description: doc.select(".jianjie").text().trim(),
            detail: "书名：" + name + "<br>作者：" + (author || "未知") + "<br>" + info.join("<br>"),
            ongoing: doc.select(".detail-box .info").text().indexOf("已完结") < 0,
            genres: genres,
            comments: [
                {
                    title: "Bình luận",
                    input: BASE_URL + "/index.php?s=/Home/comment/lists/id/" + url.match(/\/(\d+)\.html/)[1] + "/type/novel/limit/5/size/12",
                    script: "comment.js"
                }
            ],
            host: BASE_URL
        });
    }
    return null;
}
