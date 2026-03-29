function execute(url) {
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let coverImg = "https://aitruyen.net" + doc.select("img.object-cover").first().attr("src");
        let author =  doc.select(".space-y-4 div div p").get(0).text();
        let detail = doc.select(".discovery-pill-rail").get(0).text();
        detail = Html.clean(detail, ["span"]);
        let description = doc.select(".discovery-supporting-copy").get(0).html().split("<br>")[0].replace(/ 　　/g,"<br>");
        //let ongoing = doc.select(".mb-3.d-flex.flex-wrap.gap-2.align-items-center span").text()
        return Response.success({
            name: doc.select("h1").text(),
            cover: coverImg,
            author: author,
            description: description,
            detail: detail,
            //ongoing: ongoing,
            host: "https://aitruyen.net"
        });
    }
    return null;
}