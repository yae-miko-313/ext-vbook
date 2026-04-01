load('config.js');
function execute(url) {
    const match = url.match(/\/manga\/[^\/]+/);
    url = BASE_URL + match[0];
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        let cover = doc.select('.summary_image img').attr('src');

        let name = doc.select(".post-title h1").text();
        if (doc.select(".post-title span").text())
            name = doc.select(".post-title span").text() + " · " + name;
        cover = cleanImageUrl(cover);

        const el = doc.select(".post-content .post-content_item");

        let author = "";
        let ongoing = doc.select(".post-status").text().includes("Đang tiến hành") ? true : false;
        let detail = "";
        for (let i = 0; i < el.size(); i++) {
            let e = el.get(i);
            // console.log(e.text());
            if (e.select(".summary-heading").text().includes("Tác giả")) author = e.select(".summary-content").text().trim();

            detail += e.select(".summary-heading").text().trim() + ": " + e.select(".summary-content").text().trim() + "<br>";
        }
        let description = "";
        doc.select(".summary__content p").forEach(e => {
            if (!e.html().includes("http")) description += e.html() + "<br>";
        });

        let genres = [];
        doc.select('.genres-content a').forEach(e => {
            let href = e.attr("href");
            if (href.startsWith(BASE_URL)) {
                href = href.replace(BASE_URL, "");
            }
            genres.push({
                title: e.text().trim(),
                input: href,
                script: "gen.js"
            });
        });

        let comment = null;
        if (doc.select('ol.comment-list').size() > 0 || doc.select('.comments-title').size() > 0) {
            comment = {
                input: url,
                script: "comment.js"
            };
        }

        return Response.success({
            name: name,
            cover: cover,
            author: author,
            detail: detail,
            host: BASE_URL,
            description: description,
            ongoing: ongoing,
            genres: genres,
            comment: comment
        });
    }
    return null;
}