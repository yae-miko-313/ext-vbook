function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let coverImg = doc.select("img.story-poster").first().attr("src");
        //let author =  doc.select(".mb-3.d-flex.flex-wrap.gap-2.align-items-center a").get(0).text();
        let detail = doc.select(".row.g-3.small .col-md-12.mt-3.d-flex.flex-wrap").text();
        //detail = Html.clean(detail, ["p"]);
        let description = doc.select(".content-text").html().split("<br>")[0].replace(/ 　　/g,"<br>");
        //let ongoing = doc.select(".mb-3.d-flex.flex-wrap.gap-2.align-items-center span").text()
        return Response.success({
            name: doc.select("h2").text(),
            cover: coverImg,
            //author: author,
            description: description,
            detail: detail,
            //ongoing: ongoing,
            host: "https://tiemtruyenchu.com"
        });
    }
    return null;
}