function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let coverImg = doc.select(".summary_image img").first().attr("src");
        let author =  doc.select(".author-content a").first().text();
        let detail = doc.select(".genres-content");
//        let detail = Number(doc.select(".summary-content-chapter a").attr("href").split("chuong-")[1].split("/")[0]);
//        detail = Html.clean(detail, ["p"]);
        let description = doc.select(".summary__content").text();
//        let ongoing = doc.select(".tab1 p.p5").text()
        return Response.success({
            name: doc.select(".post-title.center h1").text(),
            cover: coverImg,
            author: author,
            description: description,
            detail: detail,
//            ongoing: ongoing.indexOf("已完结") === -1,
            host: "https://xtruyen.vn/"
        });
    }
    return null;
}