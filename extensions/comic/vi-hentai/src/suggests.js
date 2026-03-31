load('config.js');
function execute(input) {
    let doc = Html.parse(input);
    let books = [];
    doc.select(".w-full").forEach(e => {
        const style_cover = e.select(".rounded-md.cover-sm").attr("style")
        const url_cover = style_cover.match(/url\('([^']+)'\)/)[1] || ''
        books.push({
            name: e.select("a").first().text(),
            link: BASE_URL + e.select("a").first().attr("href"),
            cover: url_cover,
            description: e.select(".text-sm").text(),
            host: BASE_URL
        })
    });

    return Response.success(books);
}