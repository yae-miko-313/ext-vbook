load('config.js');
function execute(url) {
    let response = fetch(BASE_URL + url);
    if (response.ok) {
        let doc = response.html();
//        let coverImg = doc.select("div.manga-image img").first().attr("src");
//        let author =  doc.select("div.author a.property-item span.author").first().text();
//        let detail = doc.select("li.list-group-item");
//        detail = Html.clean(detail, ["p"]);
//        let description = doc.select("ul li.moduleSummary div p").first().text();
//        let ongoing = doc.select("li.list-group-item.d-flex.align-items-center a").first().text();
        return Response.success({
            name: doc.select("h1.page-title.pt-2.mb-3").text(),
            cover: coverImg,
            author: author,
            description: description,
            detail: detail,
           ongoing: ongoing,
            host: BASE_URL
        });
    }
    return null;
}