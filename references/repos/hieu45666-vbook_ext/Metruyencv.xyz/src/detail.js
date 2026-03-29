load("config.js");

function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html();
        return Response.success({
            name: doc.select("h1").text(),
            author: doc.select(".author-content").text(),
            description: doc.select(".description-summary .summary__content").html(),
            cover: doc.select(".summary_image img").attr("src"),
            host: BASE_URL
        });
    }
    return null;
}