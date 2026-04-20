load('config.js');

function execute(url) {
    url = normalizeUrl(url);
    var browser = Engine.newBrowser(); // Khởi tạo browser
    var doc = browser.launch(url, 5000);
    browser.close();

        let genres = [];
        doc.select(".video-details__contents__tags a.tag").forEach(e => {
            genres.push({
                title: e.text(),
                input: normalizeUrl(e.attr("href")),
                script: "gen.js"
            });
        });

        let detail = [];
        let view = doc.select(".video-details__views").text();
        let release = "";
        
        doc.select(".video-details__information__details div").forEach(e => {
            let text = e.text().trim();
            if (text.includes("Năm phát hành")) {
                release = text.replace("Năm phát hành", "").trim();
            }
        });

        if (view) detail.push("Lượt xem: " + view);
        if (release) detail.push("Năm phát hành: " + release);

        console.log("Parsing details for: " + doc.select("h1.heading-2").text());
        let suggests = [
            {
                title: "Phim gợi ý",
                input: doc.select(".sidebar .recommended-videos").html(),
                script: "suggest.js"
            }
        ];

        return Response.success({
            name: doc.select("h1.heading-2").text(),
            cover: normalizeUrl(doc.select(".video-details__information__poster img").attr("src")),
            author: "HentaiZ",
            description: doc.select(".video-details__contents article").html(),
            detail: detail.join("<br>"),
            suggests: suggests,
            ongoing: true,
            genres: genres,
            host: BASE_URL
        });

}
