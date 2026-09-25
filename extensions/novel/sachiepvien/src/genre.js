load('config.js');
function execute() {
    let genres = [];
    ["dealstore", "tags"].forEach(function (taxonomy) {
        let response = fetch(BASE_URL + "/wp-json/wp/v2/" + taxonomy +
            "?per_page=100&orderby=count&order=desc&_fields=name,link");
        if (!response.ok) return;
        response.json().forEach(function (term) {
            genres.push({ title: term.name, input: term.link, script: "search.js" });
        });
    });
    if (genres.length === 0) return Response.error("Không lấy được danh sách thể loại");
    return Response.success(genres);
}
