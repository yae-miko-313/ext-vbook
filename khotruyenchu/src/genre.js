load('config.js');

function execute() {
    let response = fetch(BASE_URL);
    if (response.ok) {
        let doc = response.html();
        let genres = [];
        doc.select("a[href*='/the-loai/']").forEach(function(el) {
            let title = el.text().trim();
            if (title && title.length < 30) {
                genres.push({
                    title: title,
                    input: el.attr("href"),
                    script: "gen.js"
                });
            }
        });
        return Response.success(genres);
    }
    return null;
}
