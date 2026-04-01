function execute(url) {
//    let book_id = "";
//    if(url.includes("tw.linovelib.com/")){
//        let book_id = url.match(/novel\/(\d+).html/)[1];
//        url = "https://tw.linovelib.com/novel/" + book_id + ".html";
//    }
//    console.log(book_id)
//    let response = fetch("https://tw.linovelib.com/novel/" + book_id +"/catalog");
	let book_id = url.replace(".html","/catalog");
	let response = fetch(book_id);
	
    if (response.ok) {
        let doc = response.html('utf-8');
        let el = doc.select("div#volumes div.catalog-volume ul li.chapter-li.jsChapter a")
        const data = [];
        for (let i = 0;i < el.size(); i++) {
            var e = el.get(i);
            let chapter_id = e.attr("href");
            data.push({
                name: e.select("a").text(),
                url: "https://tw.linovelib.com" + chapter_id,
                host: "https://tw.linovelib.com"
            })
        }
        return Response.success(data);
    }
    return null;
}