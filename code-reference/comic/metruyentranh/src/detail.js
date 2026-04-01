load("config.js");
function execute(url) {
    var response = fetch(url);
    if (response.ok) {
        var doc = response.html();
        let info = doc.select(".detail-main");
        var title = info.select("p.detail-main-info-title");

        // Tiếp tục xử lý nếu truyện phù hợp
        var author = doc.select(".detail-main-info-author a").first().text();
        var desc = doc.select("#detail-desc").text();
        return Response.success({
            name: title.text(),
            cover: doc.select(".detail-main-cover img").first().attr("src"),
            host: BASE_URL,
            author: author,
            description: desc,
            ongoing: doc.select(".detail-list-title-1").text().indexOf("Hoàn thành") >= 0,
        });
    }
    return null;
}
