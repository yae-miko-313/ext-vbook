function execute(url) {
    if(url.includes("tw.linovelib.com/")){
        let book_id = url.match(/novel\/(\d+).html/)[1];
        url = "https://tw.linovelib.com/novel/" + book_id + ".html";
    }
    let response = fetch(url);
    if (response.ok) {
        let doc = response.html('utf-8');
        let coverImg = doc.select("img.book-cover").first().attr("src");
        let author =  doc.select(".book-cell .book-rand-a").text();
        let detail = doc.select(".book-cell .book-meta").get(2);
        detail = Html.clean(detail, ["p"]);
        let description = doc.select("#bookSummary content").html().split("<br>")[0].replace(/ 　　/g,"<br>");
        let ongoing = doc.select(".book-cell .book-meta").get(1).text()
        return Response.success({
            name: doc.select("h1.book-title").text(),
            cover: coverImg,
            author: author,
            description: description,
            detail: detail,
            ongoing: ongoing.indexOf("|") === -1,
            host: "https://tw.linovelib.com"
        });
    }
    return null;
}