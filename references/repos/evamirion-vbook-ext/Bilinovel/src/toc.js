function execute(url) {

	let book_id = url.replace(".html","/catalog");
	let response = fetch(book_id);
	
    if (response.ok) {
        let doc = response.html('utf-8');
        let el = doc.select("ul.volume-chapters li.chapter-li.jsChapter a")
        const data = [];
        for (let i = 0;i < el.size(); i++) {
            var e = el.get(i);
            let chapter_id = e.attr("href");
            data.push({
                name: e.select("a").text(),
                url: "https://www.bilinovel.com" + chapter_id,
                host: "https://www.bilinovel.com"
            })
        }
        return Response.success(data);
    }
    return null;
}