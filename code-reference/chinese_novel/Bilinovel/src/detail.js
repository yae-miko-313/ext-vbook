function execute(url) {
    if(url.includes("www.bilinovel.com/")){
        let book_id = url.match(/novel\/(\d+).html/)[1];
        url = "https://www.bilinovel.com/novel/" + book_id + ".html";
    }
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let coverImg = doc.select("div#bookDetailWrapper img").first().attr("src");
        let author =  doc.select("span.authorname a").text();
        let detail = doc.select("span.tag-small-group").text();
        detail = Html.clean(detail, ["p"]);
        let description = doc.select("content").html().split("<br>")[0].replace(/ 　　/g,"<br>");
//        let ongoing = doc.select(".book-label a.state").text()
        return Response.success({
            name: doc.select("h1.book-title").text(),
            cover: coverImg,
            author: author,
            description: description,
            detail: detail,
//            ongoing: ongoing,
            host: "https://www.bilinovel.com"
        });
    }
    return null;
}