load('config.js');
function execute(input) {
    let doc = Html.parse(input);
    let books = [];
    doc.select("a").forEach(e => {
        books.push({
            name: e.select("h3").first().text(),
            link: e.attr("href"),
            cover: e.select("img").attr("src"),
            description: e.select("h3 + span").text(),
            host: BASE_URL
        })
    });

    return Response.success(books);
}