load('config.js');
function execute() {
    let response = fetch(BASE_URL);
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let genres = [];
    doc.select("#main-nav ul.menu > li > a").forEach(function (el) {
        let href = el.attr("href");
        if (!href || href.indexOf("lienhe") !== -1) return;
        genres.push({ title: el.text().trim(), input: href, script: "search.js" });
    });

    return Response.success(genres);
}
