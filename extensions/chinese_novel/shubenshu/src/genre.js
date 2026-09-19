load('config.js');
function execute() {
    let response = fetch(BASE_URL + "/");
    if (!response.ok) return Response.error("HTTP " + response.status);
    let doc = response.html();

    let genres = [];
    doc.select("nav.nav a[href^=/list_]").forEach(function (el) {
        genres.push({ title: el.text(), input: el.attr("href"), script: "search.js" });
    });
    return Response.success(genres);
}
