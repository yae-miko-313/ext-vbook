load('config.js');

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let coverImg = doc.select("div.fixed-img figure.cover img").first().attr("src");
        let author =  doc.select("div.author a.property-item span.author").first().text();
        let detail = doc.select("div.header-stats span").get(0).text() + "</br>" + doc.select("div.header-stats span").get(1).text() + "</br>" + doc.select("div.header-stats span").get(3).text();
        detail = Html.clean(detail, ["i"]);
        let description = doc.select("div.summary div.content.expand-wrapper");
//        let ongoing = doc.select("div.header-stats ").text()
        return Response.success({
            name: doc.select("h1.novel-title.text2row").text(),
            cover: coverImg,
            author: author,
            description: description,
            detail: detail,
//           ongoing: ongoing.indexOf("已完结") === -1,
            host: BASE_URL
        });
    }
    return null;
}